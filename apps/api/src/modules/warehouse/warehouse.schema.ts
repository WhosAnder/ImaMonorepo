import { z } from 'zod';

export const warehouseItemStatusSchema = z.enum(['active', 'inactive']);

const baseWarehouseItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  unit: z.string().optional(),
  quantityOnHand: z.number().min(0),
  minQuantity: z.number().min(0).optional(),
  maxQuantity: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).optional(),
  allowNegative: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  status: warehouseItemStatusSchema.optional(),
});

export const CreateWarehouseItemSchema = baseWarehouseItemSchema.extend({
  status: warehouseItemStatusSchema.default('active'),
}).strict();

export const UpdateWarehouseItemSchema = baseWarehouseItemSchema
  .partial()
  .omit({ quantityOnHand: true })
  .strict();

export const WarehouseAdjustmentSchema = z
  .object({
    delta: z.number().refine((value) => value !== 0, {
      message: 'delta must not be zero',
    }),
    reason: z.enum(['initial', 'increase', 'decrease', 'correction', 'damage', 'audit']),
    note: z.string().optional(),
  })
  .strict();
