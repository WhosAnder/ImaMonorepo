import { ObjectId } from 'mongodb';
import { getWarehouseReportCollection } from '../../db/mongo';
import { WarehouseReport } from './warehouseReports.types';

export type WarehouseReportFilters = Partial<
  Pick<WarehouseReport, 'subsistema' | 'frecuencia' | 'tipoMantenimiento'>
>;

export async function findWarehouseReports(
  filters: WarehouseReportFilters = {}
): Promise<WarehouseReport[]> {
  const collection = await getWarehouseReportCollection();
  const query: Record<string, string> = {};

  if (filters.subsistema) query.subsistema = filters.subsistema;
  if (filters.frecuencia) query.frecuencia = filters.frecuencia;
  if (filters.tipoMantenimiento) {
    query.tipoMantenimiento = filters.tipoMantenimiento;
  }

  return collection.find(query).sort({ createdAt: -1 }).toArray();
}

export async function findWarehouseReportById(
  id: string
): Promise<WarehouseReport | null> {
  const collection = await getWarehouseReportCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

async function generateFolio(): Promise<string> {
  const collection = await getWarehouseReportCollection();
  const lastReport = await collection.findOne({}, { sort: { createdAt: -1 } });

  let nextNum = 1;
  if (lastReport?.folio?.startsWith('FA-')) {
    const parts = lastReport.folio.split('-');
    if (parts.length === 2 && parts[1]) {
      const num = parseInt(parts[1], 10);
      if (!Number.isNaN(num)) {
        nextNum = num + 1;
      }
    }
  }

  return `FA-${nextNum.toString().padStart(4, '0')}`;
}

export type NewWarehouseReport = Omit<
  WarehouseReport,
  '_id' | 'folio' | 'createdAt' | 'updatedAt'
>;

export type UpdateWarehouseReportInput = Partial<
  Omit<WarehouseReport, '_id' | 'folio' | 'createdAt'>
>;

export async function insertWarehouseReport(
  data: NewWarehouseReport
): Promise<WarehouseReport> {
  const collection = await getWarehouseReportCollection();

  const folio = await generateFolio();
  const now = new Date();
  const { stockAdjustments: _ignoredStockAdjustments, ...reportData } = data;

  const newReport: WarehouseReport = {
    ...reportData,
    folio,
    returnProcessedItemIds: data.returnProcessedItemIds ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newReport);
  return { ...newReport, _id: result.insertedId };
}

export async function updateWarehouseReportById(
  id: string,
  updates: UpdateWarehouseReportInput
): Promise<WarehouseReport | null> {
  const collection = await getWarehouseReportCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result.value;
}
