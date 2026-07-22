'use client';

import { UseFormReturn } from 'react-hook-form';
import { Button, FormField, LoadingSpinner, PasswordInput } from '@/common/components';
import { useI18n } from '@/providers/I18nProvider';
import type { ResetPasswordFormData } from '../hooks/useForgotPassword';

interface ResetPasswordFormProps {
  form: UseFormReturn<ResetPasswordFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading: boolean;
  onChangeEmail: () => void;
}

/** Step two: exchange the emailed code for a new password. */
export function ResetPasswordForm({
  form,
  onSubmit,
  isLoading,
  onChangeEmail,
}: ResetPasswordFormProps) {
  const { t } = useI18n();
  const p = t.auth.forgot.reset;
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* Deliberately generic: the request endpoint responds the same way whether or
          not the account exists, so this is all we can honestly tell the user. */}
      <p className="rounded-md border border-border bg-page px-4 py-3 text-sm text-ink-500">
        {p.notice}
      </p>

      <FormField label={p.code_label} error={errors.code?.message} required>
        <input
          {...register('code')}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          placeholder={p.code_placeholder}
          className="input bg-page text-center font-mono text-lg tracking-[0.4em]"
        />
      </FormField>

      <FormField label={p.new_password_label} error={errors.newPassword?.message} required>
        <PasswordInput
          {...register('newPassword')}
          autoComplete="new-password"
          placeholder={p.new_password_placeholder}
          className="input bg-page"
        />
      </FormField>

      <FormField label={p.confirm_password_label} error={errors.confirmPassword?.message} required>
        <PasswordInput
          {...register('confirmPassword')}
          autoComplete="new-password"
          placeholder={p.confirm_password_placeholder}
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
        {isLoading ? p.submitting : p.submit}
      </Button>

      <button
        type="button"
        onClick={onChangeEmail}
        disabled={isLoading}
        className="w-full text-center text-sm text-ink-500 transition-colors hover:text-ink-900 disabled:opacity-60"
      >
        {p.change_email}
      </button>
    </form>
  );
}
