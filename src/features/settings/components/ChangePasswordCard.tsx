'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/common/utils/error.utils';
import { PasswordInput } from '@/common/components';
import { useAuth } from '@/features/auth';
import { useChangePassword } from '../hooks/useSettings';
import { FieldRow, inputCls } from './shared';
import type { ChangePasswordFormValues } from '../types/settings.types';

// Give the success message a beat to be read before the sign-out redirect fires.
const LOGOUT_DELAY_MS = 1500;

export function ChangePasswordCard() {
  const { t } = useI18n();
  const p = t.settings.security;
  const toast = useToast();
  const { logout } = useAuth();
  const { changePassword, isChanging } = useChangePassword();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
      setDone(true);
      toast.success(p.toast.success);
      // Changing the password revokes every refresh token on the backend, so the
      // session is effectively over. Sign out and send the user to /login instead
      // of letting them hit a surprise forced logout when the access token expires.
      setTimeout(() => logout(), LOGOUT_DELAY_MS);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  });

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-[15px] font-semibold text-ink-900">{p.title}</h2>
        <p className="text-[13px] text-ink-500 mt-0.5">{p.subtitle}</p>
      </div>

      {done ? (
        <div className="px-6 py-8 text-center">
          <p className="text-[14px] font-medium text-ink-900">{p.done.title}</p>
          <p className="text-[13px] text-ink-500 mt-1">{p.done.subtitle}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FieldRow label={p.currentPassword} error={errors.currentPassword?.message}>
            <PasswordInput
              {...register('currentPassword', { required: p.validation.currentRequired })}
              autoComplete="current-password"
              className={inputCls(!!errors.currentPassword)}
            />
          </FieldRow>

          <FieldRow label={p.newPassword} error={errors.newPassword?.message}>
            <PasswordInput
              {...register('newPassword', {
                required: p.validation.newRequired,
                minLength: { value: 6, message: p.validation.newMin },
              })}
              autoComplete="new-password"
              className={inputCls(!!errors.newPassword)}
            />
          </FieldRow>

          <FieldRow label={p.confirmPassword} error={errors.confirmPassword?.message} last>
            <PasswordInput
              {...register('confirmPassword', {
                required: p.validation.confirmRequired,
                validate: (value) => value === watch('newPassword') || p.validation.mismatch,
              })}
              autoComplete="new-password"
              className={inputCls(!!errors.confirmPassword)}
            />
          </FieldRow>

          <div className="px-6 py-4 border-t border-border bg-sand-100/50">
            <button
              type="submit"
              disabled={isChanging}
              className="h-9 px-5 bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-60 disabled:pointer-events-none"
            >
              {isChanging ? '...' : p.submit}
            </button>
            <p className="text-[12px] text-ink-400 mt-2.5">{p.hint}</p>
          </div>
        </form>
      )}
    </div>
  );
}
