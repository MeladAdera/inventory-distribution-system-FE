import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3).max(150),
  description: z.string().optional(),
  barcode: z.string().optional(),
  price: z
    .number()
    .positive()
    .refine((v) => Number(v.toFixed(2)) === v, { message: 'Max 2 decimal places' }),
  cost_price: z
    .number()
    .min(0)
    .refine((v) => Number(v.toFixed(2)) === v, { message: 'Max 2 decimal places' })
    .optional(),
  category_id: z.number().positive(),
});

export const updateProductSchema = createProductSchema.partial();

// ── Form schema (used by ProductFormModal with RHF) ───────────────────────

export const productFormSchema = z.object({
  name: z.string().min(3, 'Minimum 3 characters'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  // Only shown/required in 'add' mode (see productFormAddSchema below) — edit
  // mode never renders this field, so it must not be validated here. Without
  // this, catalog products seeded with price = 0 fail this check on every
  // edit submit and the form silently no-ops (no visible error, no request).
  price: z.number().optional(),
  // Registered with setValueAs (empty input → undefined), not valueAsNumber
  cost_price: z.number().min(0, 'Must be 0 or more').optional(),
  category_id: z.number().positive('Category is required'),
  initialQuantity: z.number().min(0).optional(),
  // Admin-only flag; absent (undefined) when the form is used by shop users
  is_orderable: z.boolean().optional(),
});

// 'add' mode does render + require the price field, so enforce it there only.
export const productFormAddSchema = productFormSchema.extend({
  price: z.number().positive('Price must be greater than 0'),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
