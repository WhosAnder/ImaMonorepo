import { Context } from "hono";
import { ZodError } from "zod";
import { WarehouseReportSchema } from "./warehouseReports.schema";
import {
  createWarehouseReport,
  getWarehouseReportById,
  listWarehouseReports,
  processReportReturn,
  updateWarehouseReportData,
  deleteWarehouseReport,
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

/**
 * Validate that no base64 data is present in warehouse report data
 */
function validateNoBase64Data(data: any): void {
  // Check evidences in herramientas and refacciones
  const checkItems = (items: any[], fieldName: string) => {
    for (const item of items || []) {
      for (const evidence of item.evidences || []) {
        if (
          evidence.base64 ||
          (typeof evidence.previewUrl === "string" &&
            evidence.previewUrl.startsWith("data:"))
        ) {
          throw new Error(
            `Base64 data found in ${fieldName} evidences. All images must be uploaded to S3 before creating the report.`,
          );
        }
      }
    }
  };

  checkItems(data.herramientas, "herramientas");
  checkItems(data.refacciones, "refacciones");

  // Check signatures
  const checkSignature = (signature: string | undefined, name: string) => {
    if (
      signature &&
      typeof signature === "string" &&
      signature.startsWith("data:")
    ) {
      throw new Error(
        `Base64 data found in ${name}. Signature must be uploaded to S3 before creating the report.`,
      );
    }
  };

  checkSignature(data.firmaQuienRecibe, "firmaQuienRecibe");
  checkSignature(data.firmaAlmacenista, "firmaAlmacenista");
  checkSignature(data.firmaQuienEntrega, "firmaQuienEntrega");
}

export async function createWarehouseReportController(c: Context) {
  try {
    const body = await c.req.json();
    const validatedData = WarehouseReportSchema.parse(body);

    // Validate no base64 data
    validateNoBase64Data(validatedData);

    const actor = await getRequestUser(c);

    if (!actor) {
      return c.json({ error: "Unauthorized" }, 401);
    }

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
      return c.json({ error: "Validation Error", details: error.issues }, 400);
    }
    console.error("Error creating warehouse report:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function updateWarehouseReportController(c: Context) {
  const id = c.req.param("id");
  try {
    const body = await c.req.json();

    // Check if report exists first
    const existing = await getWarehouseReportById(id);
    if (!existing) {
      return c.json({ error: "Report not found" }, 404);
    }

    // Validate incoming data (partial validation for updates)
    const validatedData = WarehouseReportSchema.partial().parse(body);

    // Filter and convert null to undefined for compatibility
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(validatedData)) {
      if (value !== null) {
        updateData[key] = value;
      }
    }

    const updatedReport = await updateWarehouseReportData(id, updateData);
    if (!updatedReport) {
      return c.json({ error: "Failed to update report" }, 500);
    }

    return c.json(mapReportToResponse(updatedReport));
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ error: "Validation Error", details: error.issues }, 400);
    }
    console.error("Error updating warehouse report:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function deleteWarehouseReportController(c: Context) {
  const id = c.req.param("id");
  try {
    // Check if report exists first
    const existing = await getWarehouseReportById(id);
    if (!existing) {
      return c.json({ error: "Report not found" }, 404);
    }

    const deleted = await deleteWarehouseReport(id);
    if (!deleted) {
      return c.json({ error: "Failed to delete report" }, 500);
    }

    return c.json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting warehouse report:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function processWarehouseReportReturnController(c: Context) {
  try {
    const id = c.req.param("id");
    const actor = await getRequestUser(c);
    let fechaHoraRecepcion: string | undefined;

    if (!actor) {
      return c.json({ error: "Unauthorized" }, 401);
    }

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
