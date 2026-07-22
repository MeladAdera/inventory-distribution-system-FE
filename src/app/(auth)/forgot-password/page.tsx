'use client';

import Link from 'next/link';
import { ArrowLeft, Boxes } from 'lucide-react';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import { RequestCodeForm } from '@/features/auth/components/RequestCodeForm';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { ResetSuccess } from '@/features/auth/components/ResetSuccess';
import { useI18n } from '@/providers/I18nProvider';
import { ErrorAlert } from '@/common/components';
import { ROUTES } from '@/common/constants/app.constants';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const p = t.auth.forgot;
  const {
    step,
    email,
    requestForm,
    resetForm,
    onRequestSubmit,
    onResetSubmit,
    backToRequest,
    isLoading,
    serverError,
  } = useForgotPassword();

  const { title, subtitle } =
    step === 'request'
      ? { title: p.request.title, subtitle: p.request.subtitle }
      : step === 'reset'
        ? { title: p.reset.title, subtitle: p.reset.subtitle.replace('{email}', email) }
        : { title: p.done.title, subtitle: p.done.subtitle };

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
          <h1 className="font-serif text-2xl text-ink-900">{title}</h1>
          <p className="mt-2 text-sm text-ink-500">{subtitle}</p>
        </div>

        {serverError && (
          <div className="mb-5">
            <ErrorAlert message={serverError} />
          </div>
        )}

        {step === 'request' && (
          <RequestCodeForm form={requestForm} onSubmit={onRequestSubmit} isLoading={isLoading} />
        )}

        {step === 'reset' && (
          <ResetPasswordForm
            form={resetForm}
            onSubmit={onResetSubmit}
            isLoading={isLoading}
            onChangeEmail={backToRequest}
          />
        )}

        {step === 'done' && <ResetSuccess />}
      </div>

      {step !== 'done' && (
        <Link
          href={ROUTES.LOGIN}
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" />
          {p.back_to_login}
        </Link>
      )}
    </div>
  );
}
