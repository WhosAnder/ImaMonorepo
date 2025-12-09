import { z } from "zod";

export const activityDetailSchema = z.object({
  templateId: z.string(),
  realizado: z.boolean(),
  observaciones: z.string().optional(),
  evidencias: z.array(z.any()).optional(),
});

export const workReportSchema = z
  .object({
    subsistema: z.string().min(1, "El subsistema es obligatorio"),
    ubicacion: z.string().min(1, "La ubicación es obligatoria"),
    fechaHoraInicio: z
      .string()
      .min(1, "La fecha y hora de inicio son obligatorias"),
    turno: z.string(),
    frecuencia: z.string().min(1, "La frecuencia es obligatoria"),
    
    trabajadores: z
      .array(z.string())
      .min(1, "Debe seleccionar al menos un trabajador"),

    // New per-activity structure
    actividadesRealizadas: z.array(activityDetailSchema).optional(),

    // Global fields removed or optional
    inspeccionRealizada: z.boolean().optional(),
    observacionesActividad: z.string().optional(),
    evidencias: z.array(z.any()).optional(),

    herramientas: z.array(z.string()).optional(),
    refacciones: z.array(z.string()).optional(),

    observacionesGenerales: z.string().optional(),
    nombreResponsable: z
      .string()
      .min(1, "El nombre del responsable es obligatorio"),
    firmaResponsable: z
      .string()
      .nullable()
      .refine((val) => val !== null, {
        message: "La firma es obligatoria",
      }),
    fechaHoraTermino: z
      .string()
      .min(1, "La fecha y hora de término son obligatorias"),
    
    templateIds: z.array(z.string()).optional(),
  });

export type WorkReportFormValues = z.infer<typeof workReportSchema>;
