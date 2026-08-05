import { z } from 'zod';
import { SUPPLIER_NOTE_MAX_LENGTH } from '../types/suppliers.types';

interface SupplierFormMessages {
  errNameRequired: string;
  errNameShort: string;
  errNoteLong: string;
}

/**
 * Built per-render so validation messages come from i18n.
 *
 * `phone` has no format rule on purpose — the backend only enforces uniqueness
 * within the shop, and suppliers are entered in whatever local format they use.
 */
export function buildSupplierSchema(m: SupplierFormMessages) {
  return z.object({
    name: z.string().min(1, m.errNameRequired).min(2, m.errNameShort),
    phone: z.string().optional(),
    note: z.string().max(SUPPLIER_NOTE_MAX_LENGTH, m.errNoteLong).optional(),
  });
}

export type SupplierFormData = z.infer<ReturnType<typeof buildSupplierSchema>>;
