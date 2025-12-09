import { API_URL } from "@/config/env";
import { Template, TemplateFilters } from "@/types/template";

export type TemplateFiltersResponse = {
  subsistemas: string[];
  tiposMantenimiento: string[];
  frecuencias: { code: string; label: string }[];
};

export async function fetchTemplateFilters(params: {
  tipoReporte: 'work' | 'warehouse';
  subsistema?: string;
  tipoMantenimiento?: string;
}): Promise<TemplateFiltersResponse> {
  const query = new URLSearchParams();
  query.append('tipoReporte', params.tipoReporte);
  if (params.subsistema) query.append('subsistema', params.subsistema);
  if (params.tipoMantenimiento) query.append('tipoMantenimiento', params.tipoMantenimiento);

  const response = await fetch(`${API_URL}/api/templates/filters?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch template filters');
  }
  return response.json();
}

export async function fetchTemplates(filters: TemplateFilters & { frecuenciaCodigo?: string } = {}): Promise<Template[]> {
  const params = new URLSearchParams();
  if (filters.tipoReporte) params.append('tipoReporte', filters.tipoReporte);
  if (filters.subsistema) params.append('subsistema', filters.subsistema);
  if (filters.tipoMantenimiento) params.append('tipoMantenimiento', filters.tipoMantenimiento);
  if (filters.frecuencia) params.append('frecuencia', filters.frecuencia);
  if (filters.frecuenciaCodigo) params.append('frecuenciaCodigo', filters.frecuenciaCodigo);

  const response = await fetch(`${API_URL}/api/templates?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }
  return response.json();
}

export async function fetchTemplateById(id: string): Promise<Template> {
  const response = await fetch(`${API_URL}/api/templates/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch template');
  }
  return response.json();
}
