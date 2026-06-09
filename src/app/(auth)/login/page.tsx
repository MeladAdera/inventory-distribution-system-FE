'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { Button, FormField, LoadingSpinner, ErrorAlert } from '@/common/components';

export default function LoginPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { form, onSubmit, isLoading, serverError } = useLogin();
  const {
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="rounded-lg bg-white p-8 shadow">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inventory System</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to your account to continue</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <FormField label="Email" error={errors.email?.message} required>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message} required>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </FormField>

        <Button
          type="submit"
          variant="default"
          className="flex w-full items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading && <LoadingSpinner size="sm" />}
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
