import { z } from 'zod';

export const stockInSchema = z.object({
  productId: z.number().positive(),
  quantity: z.number().positive(),
  // Optional so the key can be omitted to invoke the backend inherit/seed rule.
  // min(0) allows a deliberate 0 (free stock); the UI never sends null/"".
  unitCost: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const adjustInventorySchema = z.object({
  adjustment: z.number().refine((v) => v !== 0, { message: 'Adjustment cannot be zero' }),
  reason: z.string().max(500).optional(),
});

export const updateSalePriceSchema = z.object({
  salePrice: z
    .number()
    .positive()
    .refine((v) => Number(v.toFixed(2)) === v, { message: 'Max 2 decimal places' }),
});

// Mirrors the backend DTO: whole number, 0 – 1,000,000 (0 = alert only at zero).
export const MAX_LOW_STOCK_THRESHOLD = 1_000_000;

export const updateLowStockThresholdSchema = z.object({
  lowStockThreshold: z.number().int().min(0).max(MAX_LOW_STOCK_THRESHOLD),
});
