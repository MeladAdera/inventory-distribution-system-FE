'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api/auth.api';
import { isAxiosError, parseApiError } from '@/common/utils/error.utils';
import { useI18n } from '@/providers/I18nProvider';

export type ForgotPasswordStep = 'request' | 'reset' | 'done';

export interface RequestCodeFormData {
  email: string;
}

export interface ResetPasswordFormData {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

const CODE_LENGTH = 6;
const CODE_PATTERN = new RegExp(`^\\d{${CODE_LENGTH}}$`);

/**
 * Drives the two-step reset flow on a single route:
 * request a code by email → submit code + new password → done.
 * The email is held here so step two can post it alongside the code.
 */
export function useForgotPassword() {
  const { t } = useI18n();
  const p = t.auth.forgot;

  const [step, setStep] = useState<ForgotPasswordStep>('request');
  const [email, setEmail] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestSchema = z.object({
    email: z
      .string()
      .min(1, p.validation.email_required)
      .email({ message: p.validation.email_invalid }),
  });

  const resetSchema = z
    .object({
      code: z
        .string()
        .min(1, p.validation.code_required)
        .regex(CODE_PATTERN, p.validation.code_invalid),
      newPassword: z
        .string()
        .min(1, p.validation.password_required)
        .min(6, p.validation.password_min),
      confirmPassword: z.string().min(1, p.validation.confirm_required),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: p.validation.mismatch,
      path: ['confirmPassword'],
    });

  const requestForm = useForm<RequestCodeFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  // Transport-level failures get friendly copy; everything else surfaces the
  // localized message the API envelope already carries (e.g. "Invalid or expired
  // reset code"), which the backend deliberately keeps generic.
  const toMessage = (error: unknown): string => {
    if (isAxiosError(error)) {
      if (!error.response) return p.errors.network;
      if (error.response.status === 429) return p.errors.rate_limited;
    }
    return parseApiError(error);
  };

  const onRequestSubmit = requestForm.handleSubmit(async (data: RequestCodeFormData) => {
    setServerError(null);
    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email: data.email });
      // The endpoint answers identically for registered, unregistered and deactivated
      // accounts, so we always advance — never branch on whether the email exists.
      setEmail(data.email);
      resetForm.reset();
      setStep('reset');
    } catch (error) {
      setServerError(toMessage(error));
    } finally {
      setIsLoading(false);
    }
  });

  const onResetSubmit = resetForm.handleSubmit(async (data: ResetPasswordFormData) => {
    setServerError(null);
    setIsLoading(true);

    try {
      await authApi.resetPassword({ email, code: data.code, newPassword: data.newPassword });
      setStep('done');
    } catch (error) {
      setServerError(toMessage(error));
    } finally {
      setIsLoading(false);
    }
  });

  // Back to step one so a mistyped address can be corrected and a fresh code issued.
  // Requesting again invalidates whatever code was sent before.
  const backToRequest = () => {
    setServerError(null);
    resetForm.reset();
    setStep('request');
  };

  return {
    step,
    email,
    requestForm,
    resetForm,
    onRequestSubmit,
    onResetSubmit,
    backToRequest,
    isLoading,
    serverError,
  };
}
