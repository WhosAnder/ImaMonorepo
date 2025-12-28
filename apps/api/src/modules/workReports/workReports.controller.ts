import { Context } from "hono";
import { ZodError } from "zod";
import { WorkReportSchema } from "./workReports.schema";
import {
  createWorkReport,
  getWorkReportById,
  listWorkReports,
  updateWorkReport,
  deleteWorkReport,
} from "./workReports.service";
import { WorkReportFilters, NewWorkReport } from "./workReports.repository";

function mapReportToResponse(report: any) {
  const { _id, ...rest } = report;
  return {
    id: _id?.toString(),
    ...rest,
  };
}

export async function listWorkReportsController(c: Context) {
  const subsistema = c.req.query("subsistema");
  const frecuencia = c.req.query("frecuencia");
  const tipoMantenimiento = c.req.query("tipoMantenimiento");
  const limitStr = c.req.query("limit");
  const offsetStr = c.req.query("offset");

  const filters: WorkReportFilters = {};
  if (subsistema) filters.subsistema = subsistema;
  if (frecuencia) filters.frecuencia = frecuencia;
  if (tipoMantenimiento) filters.tipoMantenimiento = tipoMantenimiento;

  const pagination = {
    limit: limitStr ? parseInt(limitStr, 10) : undefined,
    offset: offsetStr ? parseInt(offsetStr, 10) : undefined,
  };

  const result = await listWorkReports(filters, pagination);

  return c.json({
    data: result.data.map(mapReportToResponse),
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  });
}

export async function getWorkReportByIdController(c: Context) {
  const id = c.req.param("id");
  try {
    const report = await getWorkReportById(id);
    if (!report) {
      return c.json({ error: "Report not found" }, 404);
    }
    return c.json(mapReportToResponse(report));
  } catch {
    return c.json({ error: "Invalid ID format" }, 400);
  }
}

export async function createWorkReportController(c: Context) {
  try {
    const body = await c.req.json();
    const validatedData = WorkReportSchema.parse(body);

    const fecha = validatedData.fechaHoraInicio.substring(0, 10);

    const dataToCreate: NewWorkReport = {
      ...validatedData,
      fechaHoraTermino:
        validatedData.fechaHoraTermino || new Date().toISOString(),
      herramientas: validatedData.herramientas || [],
      refacciones: validatedData.refacciones || [],
      evidencias: validatedData.evidencias || [],
      fecha,
      responsable: validatedData.nombreResponsable,
      firmaResponsable: validatedData.firmaResponsable || undefined,
    };

    const newReport = await createWorkReport(dataToCreate);
    return c.json(newReport, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ error: "Validation Error", details: error.errors }, 400);
    }
    console.error("Error creating work report:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function updateWorkReportController(c: Context) {
  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    
    // Check if report exists first
    const existing = await getWorkReportById(id);
    if (!existing) {
      return c.json({ error: "Report not found" }, 404);
    }

    // Validate incoming data (partial validation for updates)
    const validatedData = WorkReportSchema.partial().parse(body);
    
    // Filter and convert null to undefined for compatibility
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(validatedData)) {
      if (value !== null) {
        updateData[key] = value;
      }
    }

    const updatedReport = await updateWorkReport(id, updateData);
    if (!updatedReport) {
      return c.json({ error: "Failed to update report" }, 500);
    }

    return c.json(mapReportToResponse(updatedReport));
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ error: "Validation Error", details: error.errors }, 400);
    }
    console.error("Error updating work report:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}

export async function deleteWorkReportController(c: Context) {
  const id = c.req.param("id");
  try {
    // Check if report exists first
    const existing = await getWorkReportById(id);
    if (!existing) {
      return c.json({ error: "Report not found" }, 404);
    }

    const deleted = await deleteWorkReport(id);
    if (!deleted) {
      return c.json({ error: "Failed to delete report" }, 500);
    }

    return c.json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting work report:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
}
