import { z } from 'zod';

export const TemplateSectionKeySchema = z.enum([
  'actividad',
  'herramientas',
  'refacciones',
  'observacionesGenerales',
  'fechas',
  'firmas',
]);

export const TemplateSectionConfigSchema = z.object({
  enabled: z.boolean(),
  label: z.string().optional(),
  required: z.boolean().optional(),
});

export const TemplateSchema = z.object({
  codigoMantenimiento: z.string().optional().nullable(),
  tipoReporte: z.enum(['work', 'warehouse']),
  subsistema: z.string().min(1),
  tipoMantenimiento: z.string().min(1),
  frecuencia: z.string().min(1),
  frecuenciaCodigo: z.string().min(1),
  nombreCorto: z.string().min(1),
  descripcion: z.string().optional(),
  secciones: z.object({
    actividad: TemplateSectionConfigSchema,
    herramientas: TemplateSectionConfigSchema,
    refacciones: TemplateSectionConfigSchema,
    observacionesGenerales: TemplateSectionConfigSchema,
    fechas: TemplateSectionConfigSchema,
    firmas: TemplateSectionConfigSchema,
  }),
  activo: z.boolean().default(true),
});

export type CreateTemplateInput = z.infer<typeof TemplateSchema>;
