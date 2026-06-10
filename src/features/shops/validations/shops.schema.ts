import { z } from 'zod';

export const updateShopSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  address: z.string().min(1, 'Address cannot be empty').optional(),
  phone: z.string().min(1, 'Phone cannot be empty').optional(),
});

export const updateShopStatusSchema = z.object({
  isActive: z.boolean(),
});
