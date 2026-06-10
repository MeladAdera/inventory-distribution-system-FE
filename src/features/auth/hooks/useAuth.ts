'use client';

import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';
import { tokenUtils } from '../utils/token.utils';

export function useAuth() {
  const { user, isAuthenticated, isInitializing, clearAuth } = useAuthStore();

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue with local cleanup regardless of backend response
    } finally {
      clearAuth();
      tokenUtils.clearTokens();
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
