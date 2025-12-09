import { RequestUser } from '../../types/auth';
import {
  adjustStockForReportDelivery,
  adjustStockForReportReturn,
  StockAdjustmentOutcome,
} from '../warehouse/warehouse.service';
import {
  NewWarehouseReport,
  WarehouseReportFilters,
  UpdateWarehouseReportInput,
  findWarehouseReportById,
  findWarehouseReports,
  insertWarehouseReport,
  updateWarehouseReportById,
} from './warehouseReports.repository';
import {
  StockAdjustmentSummary,
  WarehouseItem,
  WarehouseReport,
  WarehouseReportWithAdjustments,
} from './warehouseReports.types';

export async function listWarehouseReports(
  filters: WarehouseReportFilters = {}
) {
  return findWarehouseReports(filters);
}

export async function getWarehouseReportById(id: string) {
  return findWarehouseReportById(id);
}

function emptyAdjustmentSummary(): StockAdjustmentSummary {
  return {
    processed: 0,
    failed: [],
    warnings: [],
  };
}

function collectReportItems(report: Partial<WarehouseReport>): WarehouseItem[] {
  const herramientas = report.herramientas ?? [];
  const refacciones = report.refacciones ?? [];
  return [...herramientas, ...refacciones];
}

type AdjustmentHandler = (
  sku: string,
  units: number,
  reportFolio: string,
  actor: RequestUser
) => Promise<StockAdjustmentOutcome>;

async function processItemsForAdjustments(
  report: WarehouseReport,
  actor: RequestUser,
  handler: AdjustmentHandler,
  options?: {
    skipItemIds?: Set<string>;
  }
): Promise<{ summary: StockAdjustmentSummary; processedItemIds: string[] }> {
  const summary = emptyAdjustmentSummary();
  const processedItemIds: string[] = [];

  for (const item of collectReportItems(report)) {
    if (options?.skipItemIds?.has(item.id)) {
      continue;
    }

    if (!item.sku) {
      summary.warnings.push(
        `Item "${item.name}" does not have a SKU and was skipped`
      );
      continue;
    }

    const result = await handler(item.sku, item.units, report.folio, actor);
    if (result.success) {
      summary.processed += 1;
      processedItemIds.push(item.id);
      continue;
    }

    summary.failed.push({
      sku: item.sku,
      reason: result.failureReason ?? 'Unknown error',
    });
    summary.warnings.push(
      `Failed to adjust SKU ${item.sku}: ${
        result.failureReason ?? 'Unknown error'
      }`
    );
  }

  return { summary, processedItemIds };
}

export async function createWarehouseReport(
  data: NewWarehouseReport,
  actor?: RequestUser
): Promise<WarehouseReportWithAdjustments> {
  const newReport = await insertWarehouseReport({
    ...data,
    fechaHoraRecepcion: data.fechaHoraRecepcion,
  });

  if (!actor) {
    return newReport;
  }

  const { summary } = await processItemsForAdjustments(
    newReport,
    actor,
    adjustStockForReportDelivery
  );

  if (!newReport._id) {
    return { ...newReport, stockAdjustments: summary };
  }

  if (summary.processed === 0) {
    return { ...newReport, stockAdjustments: summary };
  }

  const deliveryAdjustedAt = new Date();
  const updatedReport =
    (await updateWarehouseReportById(newReport._id.toString(), {
      deliveryAdjustedAt,
    })) ?? newReport;

  return {
    ...updatedReport,
    stockAdjustments: summary,
  };
}

export async function processReportReturn(
  reportId: string,
  actor: RequestUser,
  fechaHoraRecepcion?: string
): Promise<WarehouseReportWithAdjustments> {
  const report = await findWarehouseReportById(reportId);
  if (!report) {
    throw new Error('REPORT_NOT_FOUND');
  }

  const processedSet = new Set(report.returnProcessedItemIds ?? []);
  const { summary, processedItemIds } = await processItemsForAdjustments(
    report,
    actor,
    adjustStockForReportReturn,
    { skipItemIds: processedSet }
  );

  const updates: UpdateWarehouseReportInput = {};
  const nextProcessedIds =
    processedItemIds.length > 0
      ? Array.from(new Set([...processedSet, ...processedItemIds]))
      : undefined;

  if (nextProcessedIds) {
    updates.returnProcessedItemIds = nextProcessedIds;
    updates.returnAdjustedAt = new Date();
  }

  const shouldSetReturnDate =
    !report.fechaHoraRecepcion || typeof fechaHoraRecepcion === 'string';
  if (shouldSetReturnDate) {
    const effectiveDate =
      fechaHoraRecepcion ||
      report.fechaHoraRecepcion ||
      new Date().toISOString();
    updates.fechaHoraRecepcion = effectiveDate;
  }

  const shouldPersistUpdates =
    Object.keys(updates).length > 0 && report._id != null;

  const updatedReport = shouldPersistUpdates
    ? await updateWarehouseReportById(report._id!.toString(), updates)
    : report;

  return {
    ...(updatedReport ?? report),
    stockAdjustments: summary,
  };
}
