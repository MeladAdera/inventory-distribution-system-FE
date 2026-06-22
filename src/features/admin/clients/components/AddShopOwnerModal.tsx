'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { addShopOwnerSchema, type AddShopOwnerFormData } from '../validations/clients.schema';

interface AddShopOwnerModalProps {
  open: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: AddShopOwnerFormData) => void;
}

export function AddShopOwnerModal({
  open,
  isSubmitting,
  onClose,
  onSubmit: onSave,
}: AddShopOwnerModalProps) {
  const { t } = useI18n();
  const p = t.clients;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddShopOwnerFormData>({
    resolver: zodResolver(addShopOwnerSchema),
    defaultValues: { shopName: '', shopAddress: '', ownerName: '', email: '', password: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset({ shopName: '', shopAddress: '', ownerName: '', email: '', password: '' });
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const onSubmitForm = handleSubmit(onSave);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full bg-paper flex flex-col max-h-[90vh]',
          'sm:rounded-xl sm:max-w-140',
          'rounded-t-2xl sm:rounded-t-xl',
          'animate-pop-in'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-ink-900">{p.add.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          id="add-shop-owner-form"
          onSubmit={onSubmitForm}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        >
          {/* Shop name + address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={p.add.shopName}
              required
              error={errors.shopName?.message ? p.add.errShopName : undefined}
            >
              <input
                {...register('shopName')}
                placeholder={p.add.shopNamePlaceholder}
                className={ipt(!!errors.shopName)}
              />
            </Field>
            <Field label={p.add.shopAddress}>
              <input
                {...register('shopAddress')}
                placeholder={p.add.shopAddressPlaceholder}
                className={ipt(false)}
              />
            </Field>
          </div>

          {/* Owner name */}
          <Field
            label={p.add.ownerName}
            required
            error={errors.ownerName?.message ? p.add.errOwnerName : undefined}
          >
            <input
              {...register('ownerName')}
              placeholder={p.add.ownerNamePlaceholder}
              className={ipt(!!errors.ownerName)}
            />
          </Field>

          {/* Email + password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={p.add.email}
              required
              error={errors.email?.message ? p.add.errEmail : undefined}
            >
              <input
                {...register('email')}
                type="email"
                placeholder={p.add.emailPlaceholder}
                className={ipt(!!errors.email)}
                dir="ltr"
              />
            </Field>
            <Field
              label={p.add.password}
              required
              error={errors.password?.message ? p.add.errPassword : undefined}
            >
              <input
                {...register('password')}
                type="password"
                placeholder={p.add.passwordPlaceholder}
                className={ipt(!!errors.password)}
                dir="ltr"
              />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-border shrink-0">
          <button
            type="submit"
            form="add-shop-owner-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 h-10 px-5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Check size={15} />
            {p.add.save}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 border border-border rounded-lg text-sm text-ink-700 font-medium hover:bg-sand-100 transition-colors"
          >
            {p.add.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ipt(hasError: boolean) {
  return cn(
    'w-full h-10 px-3 bg-paper border rounded-lg text-sm text-ink-900 placeholder-ink-300',
    'focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-50',
    hasError ? 'border-danger-700' : 'border-border'
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-600">
        {label}
        {required && <span className="text-danger-700 ms-0.75">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger-700">{error}</p>}
    </div>
  );
}
