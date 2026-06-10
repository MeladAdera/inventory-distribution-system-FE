'use client';

import { useAuth } from '@/features/auth';
import { UserRole } from '@/features/auth/types/enums';

export function usePermission() {
  const { user } = useAuth();

  const isWarehouseAdmin = user?.role === UserRole.WAREHOUSE_ADMIN;
  const isShopOwner = user?.role === UserRole.SHOP_OWNER;
  const isEmployee = user?.role === UserRole.EMPLOYEE;

  const roleHierarchy = [UserRole.EMPLOYEE, UserRole.SHOP_OWNER, UserRole.WAREHOUSE_ADMIN];

  const hasMinRole = (minRole: UserRole): boolean => {
    if (!user) return false;
    return roleHierarchy.indexOf(user.role as UserRole) >= roleHierarchy.indexOf(minRole);
  };

  return {
    user,
    isAuthenticated: !!user,
    isWarehouseAdmin,
    isShopOwner,
    isEmployee,
    canCreate: isWarehouseAdmin || isShopOwner,
    canEdit: isWarehouseAdmin || isShopOwner,
    canDelete: isWarehouseAdmin || isShopOwner,
    hasPermission: (role: UserRole) => user?.role === role,
    hasMinRole,
  };
}
