'use client';

import { useAuth } from '@/features/auth';

export function usePermission(requiredRole?: string) {
  const { user } = useAuth();

  const hasPermission = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const canAccess = (): boolean => {
    if (!user) return false;
    if (!requiredRole) return true;
    return hasPermission(requiredRole);
  };

  return {
    user,
    hasPermission,
    canAccess,
    isAuthenticated: !!user,
  };
}
