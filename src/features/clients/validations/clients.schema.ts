import { z } from 'zod';

export const clientFormSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export const addShopOwnerSchema = z.object({
  shopName: z.string().min(1),
  shopAddress: z.string().optional(),
  ownerName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export type AddShopOwnerFormData = z.infer<typeof addShopOwnerSchema>;
