import { z } from 'zod';

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
