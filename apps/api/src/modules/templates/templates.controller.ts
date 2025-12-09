import { Context } from 'hono';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';
import { TemplateSchema } from './templates.schema';
import {
  createTemplate,
  getTemplateByObjectId,
  getTemplateFilters,
  listTemplates,
  TemplateListParams,
} from './templates.service';
import { ReportType } from './templates.types';

export async function getTemplateFiltersController(c: Context) {
  try {
    const tipoReporte = c.req.query('tipoReporte') as ReportType | undefined;
    const subsistema = c.req.query('subsistema');
    const tipoMantenimiento = c.req.query('tipoMantenimiento');
    const filters = await getTemplateFilters(tipoReporte, subsistema, tipoMantenimiento);
    return c.json(filters);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

export async function listTemplatesController(c: Context) {
  try {
    const params: TemplateListParams = {
      tipo: c.req.query('tipo'),
      tipoReporte: c.req.query('tipoReporte'),
      subsistema: c.req.query('subsistema'),
      tipoMantenimiento: c.req.query('tipoMantenimiento'),
      frecuencia: c.req.query('frecuencia'),
      frecuenciaCodigo: c.req.query('frecuenciaCodigo'),
      activo: c.req.query('activo'),
    };

    const templates = await listTemplates(params);
    return c.json(templates);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

export async function getTemplateByIdController(c: Context) {
  try {
    const id = c.req.param('id');
    if (!ObjectId.isValid(id)) {
      return c.json({ error: 'Invalid ID format' }, 400);
    }

    const template = await getTemplateByObjectId(new ObjectId(id));
    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    return c.json(template);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
}

export async function createTemplateController(c: Context) {
  try {
    const body = await c.req.json();
    const result = TemplateSchema.safeParse(body);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    const insertedId = await createTemplate(result.data);
    return c.json({ id: insertedId }, 201);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: error.message }, 500);
  }
}
