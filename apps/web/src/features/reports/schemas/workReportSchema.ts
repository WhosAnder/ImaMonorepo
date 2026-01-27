import { z } from "zod";

export const activityDetailSchema = z.object({
  templateId: z.string(),
  nombre: z.string(), // Activity name for display
  realizado: z.boolean().default(true), // Auto-true when selected
  observaciones: z.string().optional(),
  evidencias: z.array(z.any()).optional(),
});

export const workReportSchema = z
  .object({
    subsistema: z.string().min(1, "El subsistema es obligatorio"),
    customSubsistema: z.string().optional(),
    cliente: z.string().default("AEROTREN AICM"),
    ubicacion: z.string().min(1, "La ubicación es obligatoria"),
    fechaHoraInicio: z
      .string()
      .min(1, "La fecha y hora de inicio son obligatorias"),
    turno: z.string(),
    frecuencia: z.string().optional(),
    customFrecuencia: z.string().optional(),

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
    fechaHoraTermino: z.string().optional(),

    templateIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.subsistema === "Otros") {
      if (!data.customSubsistema?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customSubsistema"],
          message: "Especifica el subsistema",
        });
      }
      if (!data.customFrecuencia?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customFrecuencia"],
          message: "Especifica la frecuencia",
        });
      }
    } else if (!data.frecuencia?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["frecuencia"],
        message: "La frecuencia es obligatoria",
      });
    }
  });

export type WorkReportFormValues = z.infer<typeof workReportSchema>;
