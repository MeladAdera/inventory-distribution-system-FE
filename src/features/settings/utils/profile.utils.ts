import type { UserRole } from '@/features/auth/types/enums';

export const ROLE_BADGE_CLS: Record<UserRole, string> = {
  WAREHOUSE_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  SHOP_OWNER: 'bg-amber-50 text-amber-700 border-amber-200',
  EMPLOYEE: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function getInitials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? '').toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}
