'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Boxes } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useI18n } from '@/providers/I18nProvider';
import { Button, FormField, LoadingSpinner, ErrorAlert, PasswordInput } from '@/common/components';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
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
    <div>
      {/* brand mark linking back to the landing page */}
      <Link href="/" className="mb-6 flex items-center justify-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-amber-500">
          <Boxes size={20} />
        </span>
        <span className="font-serif text-xl font-medium text-ink-900">{t.landing.brand}</span>
      </Link>

      <div className="rounded-2xl border border-border bg-paper p-8 shadow-[0_16px_48px_rgba(14,27,44,0.10)]">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-2xl text-ink-900">{t.auth.login.title}</h1>
          <p className="mt-2 text-sm text-ink-500">{t.auth.login.subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {serverError && <ErrorAlert message={serverError} />}

          <FormField label={t.auth.login.email_label} error={errors.email?.message} required>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder={t.auth.login.email_placeholder}
              className="input bg-page"
            />
          </FormField>

          <FormField label={t.auth.login.password_label} error={errors.password?.message} required>
            <PasswordInput
              {...register('password')}
              autoComplete="current-password"
              placeholder={t.auth.login.password_placeholder}
              className="input bg-page"
            />
          </FormField>

          <Button
            type="submit"
            variant="default"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-900 py-2.5 text-sm font-medium shadow-md hover:bg-ink-700 hover:shadow-lg"
            disabled={isLoading}
          >
            {isLoading && <LoadingSpinner size="sm" />}
            {isLoading ? t.auth.login.submitting : t.auth.login.submit}
          </Button>
        </form>
      </div>

      <Link
        href="/"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft size={15} className="rtl:rotate-180" />
        {t.landing.nav.backHome}
      </Link>
    </div>
  );
}
