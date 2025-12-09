import { ObjectId } from 'mongodb';

export type ReportType = 'work' | 'warehouse';

export type TemplateSectionKey =
  | 'actividad'
  | 'herramientas'
  | 'refacciones'
  | 'observacionesGenerales'
  | 'fechas'
  | 'firmas';

export interface TemplateSectionConfig {
  enabled: boolean;
  label?: string;
  required?: boolean;
}

export interface Template {
  _id?: ObjectId;
  codigoMantenimiento?: string | null;
  tipoReporte: ReportType;
  subsistema: string;
  tipoMantenimiento: string;
  frecuencia: string;
  frecuenciaCodigo: string;
  nombreCorto: string;
  descripcion?: string;
  secciones: Record<TemplateSectionKey, TemplateSectionConfig>;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
