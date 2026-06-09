'use client';

import { useEffect } from 'react';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { tokenUtils } from '@/features/auth/utils/token.utils';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const accessToken = tokenUtils.getAccessToken();
    const refreshToken = tokenUtils.getRefreshToken();

    if (!accessToken) return;

    authApi
      .getCurrentUser()
      .then((response) => {
        // Sync Zustand with fresh user from backend, keep current tokens
        setAuth(response.data, accessToken, refreshToken ?? '');
      })
      .catch(() => {
        // Token invalid or expired and refresh also failed — clear everything
        clearAuth();
        tokenUtils.clearTokens();
      });
  }, [setAuth, clearAuth]);

  return <>{children}</>;
}
