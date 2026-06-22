'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { clientFormSchema, type ClientFormData } from '../validations/clients.schema';
import type { AdminClient } from '../types/clients.types';

interface ClientFormModalProps {
  open: boolean;
  client: AdminClient | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onEdit: (client: AdminClient, data: ClientFormData) => void;
}

export function ClientFormModal({
  open,
  client,
  isSubmitting,
  onClose,
  onEdit,
}: ClientFormModalProps) {
  const { t } = useI18n();
  const p = t.clients;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { name: '', phone: '', address: '' },
  });

  useEffect(() => {
    if (!open || !client) return;
    reset({
      name: client.name_ar,
      phone: client.phone === '—' ? '' : client.phone,
      address: client.city_ar === '—' ? '' : client.city_ar,
    });
  }, [open, client, reset]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !client) return null;

  const onSubmit = handleSubmit((data) => onEdit(client, data));

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
          <h2 className="text-lg font-semibold text-ink-900">{p.form.editTitle}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          id="client-form"
          onSubmit={onSubmit}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        >
          {/* Name */}
          <Field
            label={p.form.name}
            required
            error={errors.name?.message ? p.form.errName : undefined}
          >
            <input
              {...register('name')}
              placeholder={p.form.namePlaceholder}
              className={ipt(!!errors.name)}
            />
          </Field>

          {/* Phone + Address row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={p.form.phone}
              required
              error={errors.phone?.message ? p.form.errPhone : undefined}
            >
              <input
                {...register('phone')}
                placeholder={p.form.phonePlaceholder}
                className={cn(ipt(!!errors.phone), 'font-mono')}
                dir="ltr"
              />
            </Field>
            <Field label={p.form.address}>
              <input
                {...register('address')}
                placeholder={p.form.addressPlaceholder}
                className={ipt(false)}
              />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-border shrink-0">
          <button
            type="submit"
            form="client-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 h-10 px-5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Check size={15} />
            {p.form.save}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 border border-border rounded-lg text-sm text-ink-700 font-medium hover:bg-sand-100 transition-colors"
          >
            {p.form.cancel}
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
