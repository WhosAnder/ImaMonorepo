import { Context } from 'hono';
import { ZodError } from 'zod';
import { WorkReportSchema } from './workReports.schema';
import {
  createWorkReport,
  getWorkReportById,
  listWorkReports,
} from './workReports.service';
import { WorkReportFilters, NewWorkReport } from './workReports.repository';

export async function listWorkReportsController(c: Context) {
  const subsistema = c.req.query('subsistema');
  const frecuencia = c.req.query('frecuencia');
  const tipoMantenimiento = c.req.query('tipoMantenimiento');

  const filters: WorkReportFilters = {};
  if (subsistema) filters.subsistema = subsistema;
  if (frecuencia) filters.frecuencia = frecuencia;
  if (tipoMantenimiento) filters.tipoMantenimiento = tipoMantenimiento;

  const reports = await listWorkReports(filters);
  return c.json(reports);
}

export async function getWorkReportByIdController(c: Context) {
  const id = c.req.param('id');
  try {
    const report = await getWorkReportById(id);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }
    return c.json(report);
  } catch {
    return c.json({ error: 'Invalid ID format' }, 400);
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
      return c.json(
        { error: 'Validation Error', details: error.errors },
        400
      );
    }
    console.error('Error creating work report:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
}
