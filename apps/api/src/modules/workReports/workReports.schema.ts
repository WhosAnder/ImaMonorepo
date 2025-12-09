import { z } from 'zod';

export const WorkReportSchema = z.object({
  subsistema: z.string().min(1),
  ubicacion: z.string().min(1),
  fechaHoraInicio: z.string().min(1),
  fechaHoraTermino: z.string().optional(),
  turno: z.string(),
  frecuencia: z.string().min(1),
  tipoMantenimiento: z.string().min(1),
  templateId: z.string().optional(),
  trabajadores: z.array(z.string()).min(1),
  inspeccionRealizada: z.boolean(),
  observacionesActividad: z.string().optional(),
  evidencias: z.array(z.any()).optional(),
  herramientas: z.array(z.string()).optional(),
  refacciones: z.array(z.string()).optional(),
  observacionesGenerales: z.string().optional(),
  nombreResponsable: z.string().min(1),
  firmaResponsable: z.string().optional().nullable(),
});
