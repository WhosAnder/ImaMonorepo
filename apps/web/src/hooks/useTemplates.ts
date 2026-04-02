import { useQuery } from "@tanstack/react-query";
import {
  fetchTemplates,
  fetchTemplateById,
  fetchTemplateFilters,
} from "../api/templatesClient";
import { Template, TemplateFilters } from "@/types/template";

export function useTemplates(filters: TemplateFilters = {}) {
  return useQuery({
    queryKey: ["templates", filters],
    queryFn: () => fetchTemplates(filters),
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["template", id],
    queryFn: () => fetchTemplateById(id!),
    enabled: !!id,
  });
}

export function useTemplateForReport(params: {
  reportType: "work" | "warehouse";
  subsystem?: string;
  maintenanceType?: string;
  frequency?: string;
}) {
  return useQuery({
    queryKey: ["templateForReport", params],
    queryFn: async () => {
      const list = await fetchTemplates(params);
      return list[0] ?? null;
    },
    enabled: !!params.reportType && !!params.subsystem,
  });
}

export function useTemplateFilters(
  reportType: "work" | "warehouse",
  subsystem?: string,
  maintenanceType?: string,
) {
  return useQuery({
    queryKey: [
      "templateFilters",
      reportType,
      subsystem ?? "ALL",
      maintenanceType ?? "ALL",
    ],
    queryFn: () =>
      fetchTemplateFilters({ reportType, subsystem, maintenanceType }),
    enabled: !!reportType,
  });
}

export function useActivitiesBySubsystemAndFrequency(params: {
  reportType: "work" | "warehouse";
  subsystem?: string;
  frequencyCode?: string;
}) {
  const { reportType, subsystem, frequencyCode } = params;

  return useQuery({
    queryKey: [
      "activities",
      reportType,
      subsystem ?? "NONE",
      frequencyCode ?? "NONE",
    ],
    queryFn: async () => {
      if (!subsystem || !frequencyCode) return [];
      const templates = await fetchTemplates({
        reportType,
        subsystem,
        frequencyCode,
      });
      return templates.map((t) => ({
        id: t.id,
        code: t.frequencyCode,
        name: t.shortName ?? t.description ?? "Sin nombre",
        template: t,
      }));
    },
    enabled: !!subsystem && !!frequencyCode,
  });
}
