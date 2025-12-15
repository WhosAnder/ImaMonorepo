import { z } from "zod";

const ActivityDetailSchema = z.object({
  templateId: z.string(),
  nombre: z.string().optional(),
  realizado: z.boolean(),
  observaciones: z.string().optional(),
  evidencias: z.array(z.any()).optional(),
});

export const WorkReportSchema = z.object({
  subsistema: z.string().min(1),
  ubicacion: z.string().min(1),
  fechaHoraInicio: z.string().min(1),
  fechaHoraTermino: z.string().optional(),
  turno: z.string(),
  frecuencia: z.string().min(1),
  tipoMantenimiento: z.string().min(1),
  templateId: z.string().optional(),
  templateIds: z.array(z.string()).optional(),
  trabajadores: z.array(z.string()).min(1),
  actividadesRealizadas: z.array(ActivityDetailSchema).optional(),
  inspeccionRealizada: z.boolean(),
  observacionesActividad: z.string().optional(),
  evidencias: z.array(z.any()).optional(),
  herramientas: z.array(z.string()).optional(),
  refacciones: z.array(z.string()).optional(),
  observacionesGenerales: z.string().optional(),
  nombreResponsable: z.string().min(1),
  firmaResponsable: z.string().optional().nullable(),
});

