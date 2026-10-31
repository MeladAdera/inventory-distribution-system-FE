'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { tokenUtils } from '../utils/token.utils';
import { isAxiosError, parseApiError } from '@/common/utils/error.utils';
import { useI18n } from '@/providers/I18nProvider';
import { UserRole } from '../types/enums';
import { ROUTES } from '@/common/constants/app.constants';
import { clearUserCaches } from '@/common/offline/storage/clearUserCaches';

export interface LoginFormData {
  email: string;
  password: string;
}

export function useLogin() {
  const router = useRouter();
  const { t } = useI18n();
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t.auth.login.validation.email_required)
      .email({ message: t.auth.login.validation.email_invalid }),
    password: z
      .string()
      .min(1, t.auth.login.validation.password_required)
      .min(6, t.auth.login.validation.password_min),
  });

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (data: LoginFormData) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const response = await authApi.login(data);
      const { user, accessToken, refreshToken } = response.data;
      // Whatever a previous session left behind (one that expired rather than
      // logged out) must not be shown to this one.
      await clearUserCaches(queryClient);
      tokenUtils.setTokens(accessToken, refreshToken);
      setAuth(user);
      const dest = user.role === UserRole.SHOP_OWNER ? ROUTES.CLIENT_DASHBOARD : ROUTES.DASHBOARD;
      router.replace(dest);
    } catch (error) {
      if (isAxiosError(error) && !error.response) {
        setServerError(t.auth.login.errors.network);
      } else {
        setServerError(parseApiError(error));
      }
    } finally {
      setIsLoading(false);
    }
  });

  return {
    form,
    onSubmit,
    isLoading,
    serverError,
  };
}
