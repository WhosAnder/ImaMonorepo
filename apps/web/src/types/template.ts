export interface TemplateSectionConfig {
  enabled: boolean;
  label?: string;
  required?: boolean;
}

export interface Template {
  id: string;
  reportType: "work" | "warehouse";
  subsystem: string;
  maintenanceType: string;
  frequency: string;
  frequencyCode: string;
  activityNumber?: number;
  maintenanceCode?: string;
  shortName: string;
  description?: string;
  sections: Record<string, TemplateSectionConfig>;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateFilters {
  reportType?: "work" | "warehouse";
  subsystem?: string;
  maintenanceType?: string;
  frequency?: string;
  frequencyCode?: string;
}
