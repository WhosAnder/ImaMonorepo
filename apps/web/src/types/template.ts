export interface TemplateSectionConfig {
  enabled: boolean;
  label?: string;
  required?: boolean;
}

export interface Template {
  _id: string;
  tipoReporte: 'work' | 'warehouse';
  subsistema: string;
  tipoMantenimiento: string;
  frecuencia: string;
  frecuenciaCodigo: string;
  nombreCorto: string;
  descripcion?: string;
  codigoMantenimiento?: string;
  secciones: {
    actividad: TemplateSectionConfig;
    herramientas: TemplateSectionConfig;
    refacciones: TemplateSectionConfig;
    observacionesGenerales: TemplateSectionConfig;
    fechas: TemplateSectionConfig;
    firmas: TemplateSectionConfig;
  };
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateFilters {
  tipoReporte?: 'work' | 'warehouse';
  subsistema?: string;
  tipoMantenimiento?: string;
  frecuencia?: string;
}
