import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be at most 100 characters'),
  // Lucide icon name from the category-icon registry; optional.
  icon: z.string().max(100).optional(),
});
