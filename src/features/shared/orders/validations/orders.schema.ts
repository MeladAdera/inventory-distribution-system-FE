import { z } from 'zod';
import { OrderStatus } from '../types/orders.types';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().positive(),
        quantity: z.number().positive(),
      })
    )
    .min(1, 'At least one item is required'),
  // Admin only — a shop owner's destination is inferred from their token.
  shopId: z.number().positive().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(OrderStatus) as [string, ...string[]]),
});
