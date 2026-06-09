'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { tokenUtils } from '@/features/auth/utils/token.utils';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setInitializing } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const accessToken = tokenUtils.getAccessToken();
    const refreshToken = tokenUtils.getRefreshToken();

    if (!accessToken) {
      setInitializing(false);
      return;
    }

    authApi
      .getCurrentUser()
      .then((response) => {
        setAuth(response.data, accessToken, refreshToken ?? '');
      })
      .catch(() => {
        clearAuth();
        tokenUtils.clearTokens();
        router.replace('/login');
      })
      .finally(() => {
        setInitializing(false);
      });
  }, [setAuth, clearAuth, setInitializing, router]);

  return <>{children}</>;
}
