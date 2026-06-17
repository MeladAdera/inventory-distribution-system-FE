'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { tokenUtils } from '../utils/token.utils';
import { isAxiosError } from '@/common/utils/error.utils';
import { UserRole } from '../types/enums';
import { ROUTES } from '@/common/constants/app.constants';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Minimum 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      tokenUtils.setTokens(accessToken, refreshToken);
      setAuth(user);
      const dest = user.role === UserRole.SHOP_OWNER ? ROUTES.CLIENT_DASHBOARD : ROUTES.DASHBOARD;
      router.replace(dest);
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 401) {
          setServerError('Invalid email or password');
        } else if (!error.response) {
          setServerError('Unable to connect to server. Please try again.');
        } else {
          setServerError('Something went wrong. Please try again.');
        }
      } else {
        setServerError('Something went wrong. Please try again.');
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
