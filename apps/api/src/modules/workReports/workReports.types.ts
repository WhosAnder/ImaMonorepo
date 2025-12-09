import { ObjectId } from 'mongodb';

export interface ReportToolOrPart {
  nombre: string;
  unidad: string;
  cantidad?: number;
  observaciones?: string;
  fotoUrls?: string[];
}

export interface ActivityDetail {
  templateId: string;
  realizado: boolean;
  observaciones?: string;
  evidencias?: any[];
}

export interface WorkReport {
  _id?: ObjectId;
  folio: string;
  subsistema: string;
  ubicacion: string;
  fecha: string;
  fechaHoraInicio: string;
  fechaHoraTermino: string;
  turno: string;
  tipoMantenimiento: string;
  frecuencia: string;
  templateIds?: string[];
  actividadesRealizadas?: ActivityDetail[];
  responsable: string;
  trabajadores: string[];
  inspeccionRealizada?: boolean;
  observacionesActividad?: string;
  evidencias?: any[];
  herramientas: string[] | ReportToolOrPart[];
  refacciones: string[] | ReportToolOrPart[];
  observacionesGenerales?: string;
  firmaResponsable?: string;
  createdAt: Date;
  updatedAt: Date;
}
