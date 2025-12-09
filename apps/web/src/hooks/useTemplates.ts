import { useQuery } from "@tanstack/react-query";
import { fetchTemplates, fetchTemplateById, fetchTemplateFilters } from "../api/templatesClient";
import { Template, TemplateFilters } from "@/types/template";

export function useTemplates(filters: TemplateFilters = {}) {
  return useQuery({
    queryKey: ['templates', filters],
    queryFn: () => fetchTemplates(filters)
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => fetchTemplateById(id!),
    enabled: !!id
  });
}

export function useTemplateForReport(params: {
  tipoReporte: "work" | "warehouse";
  subsistema?: string;
  tipoMantenimiento?: string;
  frecuencia?: string;
}) {
  return useQuery({
    queryKey: ["templateForReport", params],
    queryFn: async () => {
      const list = await fetchTemplates(params);
      return list[0] ?? null;
    },
    enabled: !!params.tipoReporte && !!params.subsistema,
  });
}

export function useTemplateFilters(
  tipoReporte: 'work' | 'warehouse',
  subsistema?: string,
  tipoMantenimiento?: string
) {
  return useQuery({
    queryKey: ['templateFilters', tipoReporte, subsistema ?? 'ALL', tipoMantenimiento ?? 'ALL'],
    queryFn: () => fetchTemplateFilters({ tipoReporte, subsistema, tipoMantenimiento }),
    enabled: !!tipoReporte,
  });
}

export function useActivitiesBySubsystemAndFrequency(params: {
  tipoReporte: 'work' | 'warehouse';
  subsistema?: string;
  frecuenciaCodigo?: string;
}) {
  const { tipoReporte, subsistema, frecuenciaCodigo } = params;

  return useQuery({
    queryKey: ['activities', tipoReporte, subsistema ?? 'NONE', frecuenciaCodigo ?? 'NONE'],
    queryFn: async () => {
      if (!subsistema || !frecuenciaCodigo) return [];
      // Reuse existing templates endpoint, filtering by tipoReporte, subsistema and frecuenciaCodigo
      const templates = await fetchTemplates({
        tipoReporte,
        subsistema,
        frecuenciaCodigo,
      });
      // Map templates to activities
      return templates.map(t => ({
        id: t._id, // Assuming _id is available on the template object from API
        code: t.frecuenciaCodigo,
        name: t.nombreCorto ?? t.descripcion ?? 'Sin nombre',
        template: t // Return full template to access other fields if needed
      }));
    },
    enabled: !!subsistema && !!frecuenciaCodigo,
  });
}
