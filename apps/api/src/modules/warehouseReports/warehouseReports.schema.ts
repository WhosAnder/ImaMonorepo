import { z } from 'zod';

const WarehouseItemSchema = z.object({
  id: z.string(),
  sku: z.string().optional(),
  name: z.string(),
  units: z.number(),
  observations: z.string().optional(),
  evidences: z
    .array(
      z.object({
        id: z.string(),
        previewUrl: z.string(),
      }),
    )
    .optional(),
});

export const WarehouseReportSchema = z.object({
  subsistema: z.string().min(1),
  fechaHoraEntrega: z.string().min(1),
  fechaHoraRecepcion: z.string().optional(),
  turno: z.string(),
  tipoMantenimiento: z.string().min(1),
  frecuencia: z.string().optional(),
  templateId: z.string().optional(),
  nombreQuienRecibe: z.string().min(1),
  nombreAlmacenista: z.string().min(1),
  nombreQuienEntrega: z.string().optional(),
  nombreAlmacenistaCierre: z.string().optional(),
  herramientas: z.array(WarehouseItemSchema).optional(),
  refacciones: z.array(WarehouseItemSchema).optional(),
  observacionesGenerales: z.string().optional(),
  firmaQuienRecibe: z.string().optional(),
  firmaAlmacenista: z.string().optional(),
  firmaQuienEntrega: z.string().optional(),
});
