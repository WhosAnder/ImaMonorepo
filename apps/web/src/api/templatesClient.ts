import { REPORTS_URL } from "@/config/env";
import { Template, TemplateFilters } from "@/types/template";

export type TemplateFiltersResponse = {
  subsystems: string[];
  maintenanceTypes: string[];
  frequencies: { code: string; label: string }[];
};

export async function fetchTemplateFilters(params: {
  reportType: "work" | "warehouse";
  subsystem?: string;
  maintenanceType?: string;
}): Promise<TemplateFiltersResponse> {
  const query = new URLSearchParams();
  query.append("reportType", params.reportType);
  if (params.subsystem) query.append("subsystem", params.subsystem);
  if (params.maintenanceType)
    query.append("maintenanceType", params.maintenanceType);

  const response = await fetch(
    `${REPORTS_URL}/templates/filters?${query.toString()}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch template filters");
  }
  return response.json();
}

export async function fetchTemplates(
  filters: TemplateFilters & { frequencyCode?: string } = {},
): Promise<Template[]> {
  const params = new URLSearchParams();
  if (filters.reportType) params.append("reportType", filters.reportType);
  if (filters.subsystem) params.append("subsystem", filters.subsystem);
  if (filters.maintenanceType)
    params.append("maintenanceType", filters.maintenanceType);
  if (filters.frequency) params.append("frequency", filters.frequency);
  if (filters.frequencyCode)
    params.append("frequencyCode", filters.frequencyCode);

  const response = await fetch(
    `${REPORTS_URL}/templates?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch templates");
  }
  return response.json();
}

export async function fetchTemplateById(id: string): Promise<Template> {
  const response = await fetch(`${REPORTS_URL}/templates/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch template");
  }
  return response.json();
}
