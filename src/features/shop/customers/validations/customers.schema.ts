import { z } from 'zod';
import { CUSTOMER_NOTE_MAX_LENGTH } from '../types/customers.types';

interface CustomerFormMessages {
  errNameRequired: string;
  errNameShort: string;
  errNoteLong: string;
}

/**
 * Built per-render so validation messages come from i18n.
 *
 * `phone` has no format rule on purpose — the backend only enforces uniqueness
 * within the shop, and shops enter numbers in whatever local format they use.
 */
export function buildCustomerSchema(m: CustomerFormMessages) {
  return z.object({
    name: z.string().min(1, m.errNameRequired).min(2, m.errNameShort),
    phone: z.string().optional(),
    note: z.string().max(CUSTOMER_NOTE_MAX_LENGTH, m.errNoteLong).optional(),
  });
}

export type CustomerFormData = z.infer<ReturnType<typeof buildCustomerSchema>>;
