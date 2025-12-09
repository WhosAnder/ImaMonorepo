export interface WorkReportListItem {
  id: string;
  folio: string;
  subsistema: string;
  fecha: string;
  responsable: string;
  turno: string;
}

export interface WorkReportDetail {
  subsistema: string;
  ubicacion: string;
  fechaHoraInicio: string;
  turno: string;
  frecuencia: string;
  trabajadores: string[];
  inspeccionRealizada: boolean;
  observacionesActividad: string;
  evidencias: any[];
  herramientas: string[];
  refacciones: string[];
  observacionesGenerales: string;
  nombreResponsable: string;
  firmaResponsable: string;
  fechaHoraTermino: string;
}

export type WorkReport = WorkReportListItem & WorkReportDetail;
