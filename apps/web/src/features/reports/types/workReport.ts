export type WorkReport = {
  id: string;
  folio: string;
  subsistema: string;
  ubicacion: string;
  fechaHoraInicio: string;
  turno: string;
  frecuencia: string;
  tipoMantenimiento: string;
  trabajadores: string[];
  inspeccionRealizada: boolean;
  observacionesActividad?: string;
  // Per-activity evidences (new structure)
  actividadesRealizadas?: Array<{
    templateId?: string;
    nombre: string;
    realizado: boolean;
    observaciones?: string;
    evidencias?: Array<{
      id?: string;
      key?: string;
      url?: string;
      previewUrl?: string;
    }>;
  }>;
  // Legacy global evidences (backward compatibility)
  evidencias?: Array<
    | {
        id?: string;
        url?: string;
        previewUrl?: string;
      }
    | string
  >;
  herramientas?: string[];
  refacciones?: string[];
  observacionesGenerales?: string;
  nombreResponsable: string;
  fechaHoraTermino: string;
  firmaResponsable?: string | null;
};
