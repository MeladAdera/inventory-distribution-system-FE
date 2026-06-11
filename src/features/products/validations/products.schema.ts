import { z } from 'zod';

// ── Backend API schemas ────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(3).max(150),
  description: z.string().optional(),
  barcode: z.string().optional(),
  price: z
    .number()
    .positive()
    .refine((v) => Number(v.toFixed(2)) === v, { message: 'Max 2 decimal places' }),
  category_id: z.number().positive(),
});

export const updateProductSchema = createProductSchema.partial();

// ── Admin form schema ──────────────────────────────────────────────────────

export const adminProductFormSchema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string(),
  sku: z.string().min(1),
  category: z.enum(['bev', 'snk', 'dry', 'cln', 'can', 'bky'] as const),
  description: z.string(),
  costPrice: z.number().min(0),
  sellPrice: z.number().min(0.01),
  warehouseQty: z.number().int().min(0),
  minStock: z.number().int().min(0),
});

export type AdminProductFormData = z.infer<typeof adminProductFormSchema>;
