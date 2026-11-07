'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Boxes } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useI18n } from '@/providers/I18nProvider';
import { Button, FormField, LoadingSpinner, ErrorAlert, PasswordInput } from '@/common/components';
import { ROUTES } from '@/common/constants/app.constants';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, IS_DEMO } from '@/common/constants/demo.constants';

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

  const fillDemoAccount = (email: string) => {
    form.setValue('email', email, { shouldValidate: true });
    form.setValue('password', DEMO_PASSWORD, { shouldValidate: true });
  };

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

          {!IS_DEMO && (
            <div className="flex justify-end">
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-ink-500 transition-colors hover:text-ink-900"
              >
                {t.auth.login.forgot_link}
              </Link>
            </div>
          )}

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

        {IS_DEMO && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm font-medium text-ink-900">{t.auth.login.demo.heading}</p>
            <p className="mt-1 text-xs text-ink-500">
              {t.auth.login.demo.hint} <span className="font-mono">{DEMO_PASSWORD}</span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(({ email, role }) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => fillDemoAccount(email)}
                  className="rounded-lg border border-border bg-page px-3 py-2 text-sm text-ink-700 transition-colors hover:border-ink-500 hover:text-ink-900"
                >
                  {t.auth.login.demo[role]}
                </button>
              ))}
            </div>
          </div>
        )}
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
