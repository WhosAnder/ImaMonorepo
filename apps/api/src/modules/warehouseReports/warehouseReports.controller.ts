import { Context } from "hono";
import { ZodError } from "zod";
import { WarehouseReportSchema } from "./warehouseReports.schema";
import {
  createWarehouseReport,
  getWarehouseReportById,
  listWarehouseReports,
  processReportReturn,
} from "./warehouseReports.service";
import {
  NewWarehouseReport,
  WarehouseReportFilters,
} from "./warehouseReports.repository";
import { WarehouseItem } from "./warehouseReports.types";
import { getRequestUser } from "../../middleware/roleGuard";

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function mapReportToResponse(report: any) {
  const { _id, ...rest } = report;
  return {
    id: _id?.toString(),
    ...rest,
    // Map fields for list view compatibility
    fechaEntrega: formatDate(report.fechaHoraEntrega),
    responsableAlmacen: report.nombreAlmacenista || "",
    responsableRecepcion: report.nombreQuienRecibe || "",
  };
}

export async function listWarehouseReportsController(c: Context) {
  const subsistema = c.req.query("subsistema");
  const frecuencia = c.req.query("frecuencia");
  const tipoMantenimiento = c.req.query("tipoMantenimiento");
  const limitStr = c.req.query("limit");
  const offsetStr = c.req.query("offset");

  const filters: WarehouseReportFilters = {};
  if (subsistema) filters.subsistema = subsistema;
  if (frecuencia) filters.frecuencia = frecuencia;
  if (tipoMantenimiento) filters.tipoMantenimiento = tipoMantenimiento;

  const pagination = {
    limit: limitStr ? parseInt(limitStr, 10) : undefined,
    offset: offsetStr ? parseInt(offsetStr, 10) : undefined,
  };

  const result = await listWarehouseReports(filters, pagination);

  return c.json({
    data: result.data.map(mapReportToResponse),
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  });
}

export async function getWarehouseReportByIdController(c: Context) {
  const id = c.req.param("id");
  try {
    const report = await getWarehouseReportById(id);
    if (!report) {
      return c.json({ error: "Report not found" }, 404);
    }
    return c.json(mapReportToResponse(report));
  } catch {
    return c.json({ error: "Invalid ID format" }, 400);
  }
}

export async function createWarehouseReportController(c: Context) {
  try {
    const body = await c.req.json();
    const validatedData = WarehouseReportSchema.parse(body);
    const actor = getRequestUser(c);

    type WarehouseItemInput = Partial<WarehouseItem> &
      Pick<WarehouseItem, "id" | "name" | "units">;

    const normalizeItems = (
      items: WarehouseItemInput[] = [],
    ): WarehouseItem[] =>
      items.map((item) => ({
        ...item,
        observations: item.observations || "",
        evidences: item.evidences || [],
      }));

    const dataToCreate: NewWarehouseReport = {
      ...validatedData,
      fechaHoraRecepcion: validatedData.fechaHoraRecepcion,
      herramientas: normalizeItems(validatedData.herramientas),
      refacciones: normalizeItems(validatedData.refacciones),
      frecuencia: validatedData.frecuencia || "Eventual",
      nombreQuienEntrega: validatedData.nombreQuienEntrega || "",
      nombreAlmacenistaCierre: validatedData.nombreAlmacenistaCierre || "",
    };

    const newReport = await createWarehouseReport(dataToCreate, actor);
    return c.json(newReport, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ error: "Validation Error", details: error.errors }, 400);
    }
    console.error("Error creating warehouse report:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function processWarehouseReportReturnController(c: Context) {
  try {
    const id = c.req.param("id");
    const actor = getRequestUser(c);
    let fechaHoraRecepcion: string | undefined;

    try {
      const body = await c.req.json();
      if (body && typeof body.fechaHoraRecepcion === "string") {
        fechaHoraRecepcion = body.fechaHoraRecepcion;
      }
    } catch {
      // Ignore JSON parse errors for empty bodies
    }

    const updatedReport = await processReportReturn(
      id,
      actor,
      fechaHoraRecepcion,
    );
    return c.json(updatedReport);
  } catch (error) {
    if (error instanceof Error && error.message === "REPORT_NOT_FOUND") {
      return c.json({ error: "Report not found" }, 404);
    }
    console.error("Error processing warehouse report return:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}
