'use client';

import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, accessToken, refreshToken, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const logout = async () => {
    clearAuth();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    setAuth,
    clearAuth,
    logout,
  };
}
