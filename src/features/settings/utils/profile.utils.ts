import type { UserRole } from '@/features/auth/types/enums';

export { getInitials } from '@/common/utils/string.utils';

export const ROLE_BADGE_CLS: Record<UserRole, string> = {
  WAREHOUSE_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  SHOP_OWNER: 'bg-amber-50 text-amber-700 border-amber-200',
  EMPLOYEE: 'bg-blue-50 text-blue-700 border-blue-200',
};
