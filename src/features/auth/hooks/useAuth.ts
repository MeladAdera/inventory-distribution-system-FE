'use client';

import { useQueryClient } from '@tanstack/react-query';
import { clearUserCaches } from '@/common/offline/storage/clearUserCaches';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';
import { tokenUtils } from '../utils/token.utils';

export function useAuth() {
  const { user, isAuthenticated, isInitializing, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue with local cleanup regardless of backend response
    } finally {
      clearAuth();
      tokenUtils.clearTokens();
      await clearUserCaches(queryClient);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return {
    user,
    isAuthenticated,
    isInitializing,
    logout,
  };
}
