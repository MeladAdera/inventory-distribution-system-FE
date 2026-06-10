import { z } from 'zod';

export const stockInSchema = z.object({
  productId: z.number().positive(),
  quantity: z.number().positive(),
  notes: z.string().max(500).optional(),
});

export const adjustInventorySchema = z.object({
  adjustment: z.number().refine((v) => v !== 0, { message: 'Adjustment cannot be zero' }),
  reason: z.string().max(500).optional(),
});
