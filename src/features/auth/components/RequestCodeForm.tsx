'use client';

import { UseFormReturn } from 'react-hook-form';
import { Button, FormField, LoadingSpinner } from '@/common/components';
import { useI18n } from '@/providers/I18nProvider';
import type { RequestCodeFormData } from '../hooks/useForgotPassword';

interface RequestCodeFormProps {
  form: UseFormReturn<RequestCodeFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading: boolean;
}

/** Step one: collect the email we should send a reset code to. */
export function RequestCodeForm({ form, onSubmit, isLoading }: RequestCodeFormProps) {
  const { t } = useI18n();
  const p = t.auth.forgot.request;
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormField label={p.email_label} error={errors.email?.message} required>
        <input
          {...register('email')}
          type="email"
          autoComplete="email"
          autoFocus
          placeholder={p.email_placeholder}
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
    </form>
  );
}
