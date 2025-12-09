import { z } from 'zod';

const warehouseItemSchema = z.object({
    id: z.string(),
    sku: z.string().optional(),
    name: z.string().min(1, "Selecciona un item"),
    units: z.number().min(1, "Mínimo 1 unidad"),
    observations: z.string().default(''),
    evidences: z.array(z.any()).default([]),
});

export const warehouseReportSchema = z.object({
    // Encabezado
    subsistema: z.string().min(1, "Selecciona el subsistema"),
    fechaHoraEntrega: z.string().min(1, "Fecha de entrega requerida"),
    turno: z.string(),

    // Firmas de apertura
    nombreQuienRecibe: z.string().min(1, "Nombre requerido"),
    nombreAlmacenista: z.string().min(1, "Nombre requerido"),
    firmaQuienRecibe: z.string().nullable().optional(),
    firmaAlmacenista: z.string().nullable().optional(),

    // Items
    herramientas: z.array(warehouseItemSchema).default([]),
    refacciones: z.array(warehouseItemSchema).default([]),

    // Observaciones
    observacionesGenerales: z.string().optional().default(''),

    // Cierre
    fechaHoraRecepcion: z.string().optional(),
    nombreQuienEntrega: z.string().optional(),
    firmaQuienEntrega: z.string().nullable().optional(),
});

export type WarehouseReportFormValues = z.infer<typeof warehouseReportSchema>;
