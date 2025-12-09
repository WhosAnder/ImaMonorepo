import { ObjectId } from 'mongodb';
import { CreateTemplateInput } from './templates.schema';
import { Template } from './templates.types';
import {
  NewTemplate,
  findTemplateById,
  findTemplates,
  insertTemplate,
} from './templates.repository';

export interface TemplateListParams {
  tipo?: string;
  tipoReporte?: string;
  subsistema?: string;
  tipoMantenimiento?: string;
  frecuencia?: string;
  frecuenciaCodigo?: string;
  activo?: string;
}

export async function listTemplates(params: TemplateListParams) {
  const query: Record<string, unknown> = {};

  if (params.tipoReporte) query.tipoReporte = params.tipoReporte;
  else if (params.tipo) query.tipoReporte = params.tipo;

  if (params.subsistema) query.subsistema = params.subsistema;
  if (params.tipoMantenimiento) query.tipoMantenimiento = params.tipoMantenimiento;
  if (params.frecuencia) query.frecuencia = params.frecuencia;
  if (params.frecuenciaCodigo) query.frecuenciaCodigo = params.frecuenciaCodigo;

  if (params.activo === 'false') {
    query.activo = false;
  } else if (params.activo === 'all') {
    // no filter
  } else {
    query.activo = true;
  }

  return findTemplates(query);
}

export async function getTemplateByObjectId(id: ObjectId) {
  return findTemplateById(id);
}

export async function createTemplate(data: CreateTemplateInput) {
  const now = new Date();
  const template: NewTemplate = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const result = await insertTemplate(template);
  return result.insertedId;
}

// Mapping frequency codes to readable labels
const FREQUENCY_LABELS: Record<string, string> = {
  '1D': 'Diario',
  '1W': 'Semanal',
  '1M': 'Mensual',
  '3M': 'Trimestral (3 meses)',
  '6M': 'Semestral (6 meses)',
  '1A': 'Anual (1 año)',
  '2A': '2 años',
  '3A': '3 años',
  '4A': '4 años',
  '5A': '5 años',
  '6A': '6 años',
  '>1Y': 'Más de 1 año',
};

// Order for sorting frequencies (shortest to longest)
const FREQUENCY_ORDER = ['1D', '1W', '1M', '3M', '6M', '1A', '2A', '3A', '4A', '5A', '6A', '>1Y'];

export async function getTemplateFilters(
  tipoReporte?: string,
  subsistema?: string,
  tipoMantenimiento?: string
) {
  const baseQuery: Record<string, unknown> = {};
  if (tipoReporte) baseQuery.tipoReporte = tipoReporte;

  const templates = await findTemplates(baseQuery);

  // Get unique subsistemas
  const subsistemas = Array.from(new Set(templates.map((t) => t.subsistema))).sort();

  // Filter by subsistema if provided
  let filteredBySubsistema: Template[] = templates;
  if (subsistema) {
    filteredBySubsistema = templates.filter((t) => t.subsistema === subsistema);
  }

  // Get unique tipos de mantenimiento for the selected subsistema
  const tiposMantenimiento = Array.from(
    new Set(filteredBySubsistema.map((t) => t.tipoMantenimiento))
  ).sort();

  // Filter by tipoMantenimiento if provided
  let filteredByTipoMant: Template[] = filteredBySubsistema;
  if (tipoMantenimiento) {
    filteredByTipoMant = filteredBySubsistema.filter(
      (t) => t.tipoMantenimiento === tipoMantenimiento
    );
  }

  // Collect unique frequency codes from filtered templates
  const frecuenciaCodesSet = new Set<string>();
  filteredByTipoMant.forEach((t) => {
    if (t.frecuenciaCodigo) {
      frecuenciaCodesSet.add(t.frecuenciaCodigo);
    }
  });

  // Map codes to readable labels and sort
  const frecuencias = Array.from(frecuenciaCodesSet)
    .map((code) => ({
      code,
      label: FREQUENCY_LABELS[code] || code,
    }))
    .sort((a, b) => {
      const indexA = FREQUENCY_ORDER.indexOf(a.code);
      const indexB = FREQUENCY_ORDER.indexOf(b.code);
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });

  return { subsistemas, tiposMantenimiento, frecuencias };
}
