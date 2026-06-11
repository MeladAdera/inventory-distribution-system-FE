import { z } from 'zod';

export const clientFormSchema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().optional(),
  phone: z.string().min(1),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;
