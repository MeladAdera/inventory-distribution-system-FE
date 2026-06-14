'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import type { Transfer, TransferPrefill } from '../types/transfers.types';
import { MOCK_TRANSFER_CLIENTS, MOCK_TRANSFER_PRODUCTS } from '../mock/transfersData';

interface TransferFormValues {
  clientId: string;
  productId: string;
  qty: string;
  date: string;
  notes: string;
}

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (transfer: Omit<Transfer, 'id'>) => void;
  prefill?: TransferPrefill;
}

export function TransferModal({ open, onClose, onSave, prefill }: TransferModalProps) {
  const { t, locale } = useI18n();
  const m = t.transfers.modal;

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransferFormValues>({
    defaultValues: {
      clientId: '',
      productId: '',
      qty: '',
      date: today,
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      clientId: prefill?.client_id ? String(prefill.client_id) : '',
      productId: prefill?.product_id ? String(prefill.product_id) : '',
      qty: prefill?.qty ? String(prefill.qty) : '',
      date: today,
      notes: '',
    });
  }, [open, prefill, reset, today]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const watchedClientId = watch('clientId');
  const watchedProductId = watch('productId');
  const watchedQty = watch('qty');

  const activeClients = MOCK_TRANSFER_CLIENTS.filter((c) => c.status === 'active');
  const availableProducts = MOCK_TRANSFER_PRODUCTS.filter(
    (p) => p.is_active && p.available_qty > 0
  );

  const selectedProduct = MOCK_TRANSFER_PRODUCTS.find((p) => p.id === Number(watchedProductId));
  const qtyNum = Number(watchedQty);
  const qtyExceeds = !!selectedProduct && qtyNum > 0 && qtyNum > selectedProduct.available_qty;
  const showBanner = !!selectedProduct && qtyNum > 0;

  const isConfirmDisabled =
    !watchedClientId || !watchedProductId || !watchedQty || qtyNum <= 0 || qtyExceeds;

  const onSubmit = handleSubmit((data) => {
    const client = MOCK_TRANSFER_CLIENTS.find((c) => c.id === Number(data.clientId))!;
    const product = MOCK_TRANSFER_PRODUCTS.find((p) => p.id === Number(data.productId))!;
    onSave({
      date_ar: formatDateAR(data.date),
      date_en: formatDateEN(data.date),
      client_id: client.id,
      client_name_ar: client.name_ar,
      client_name_en: client.name_en,
      product_id: product.id,
      product_name_ar: product.name_ar,
      product_name_en: product.name_en,
      qty: qtyNum,
      notes_ar: data.notes,
      notes_en: data.notes,
      recorded_by_ar: 'سالم المنصوري',
      recorded_by_en: 'Salem Al Mansoori',
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className={cn(
          'relative z-10 w-full bg-paper flex flex-col max-h-[90vh]',
          'sm:rounded-xl sm:max-w-130',
          'rounded-t-2xl sm:rounded-t-xl',
          'animate-pop-in'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-ink-900">{m.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          id="transfer-form"
          onSubmit={onSubmit}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4.5"
        >
          {/* 1. Client Select */}
          <Field label={m.clientLabel} required error={errors.clientId ? m.errClient : undefined}>
            <select
              {...register('clientId', { required: true })}
              className={sel(!!errors.clientId)}
            >
              <option value="">{m.clientPlaceholder}</option>
              {activeClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'ar' ? c.name_ar : c.name_en}
                </option>
              ))}
            </select>
          </Field>

          {/* 2. Product Select */}
          <Field
            label={m.productLabel}
            required
            error={errors.productId ? m.errProduct : undefined}
          >
            <select
              {...register('productId', { required: true })}
              className={sel(!!errors.productId)}
            >
              <option value="">{m.productPlaceholder}</option>
              {availableProducts.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {locale === 'ar' ? prod.name_ar : prod.name_en} — {prod.available_qty}
                </option>
              ))}
            </select>
          </Field>

          {/* 3. Qty + Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Qty */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-600">
                {m.qtyLabel}
                <span className="text-danger-700 ms-0.75">*</span>
              </label>
              <input
                type="number"
                placeholder="0"
                min="1"
                {...register('qty', {
                  required: m.errQtyRequired,
                  validate: (val) => {
                    const n = Number(val);
                    if (!val || isNaN(n) || n <= 0) return m.errQtyPositive;
                    if (selectedProduct && n > selectedProduct.available_qty)
                      return m.errQtyExceeds;
                    return true;
                  },
                })}
                className={ipt(!!errors.qty)}
              />
              {selectedProduct && !errors.qty && (
                <p className="text-xs text-ink-500">
                  {m.qtyHint.replace('{n}', String(selectedProduct.available_qty))}
                </p>
              )}
              {errors.qty && <p className="text-xs text-danger-700">{errors.qty.message}</p>}
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-600">{m.dateLabel}</label>
              <input
                type="date"
                {...register('date')}
                className={cn(ipt(false), 'cursor-pointer')}
              />
            </div>
          </div>

          {/* 4. Availability Banner */}
          {showBanner && (
            <div
              className={cn(
                'flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg',
                qtyExceeds ? 'bg-[#F6DDDB]' : 'bg-[#DDEEE3]'
              )}
            >
              {qtyExceeds ? (
                <AlertCircle size={16} className="text-danger-700 shrink-0" />
              ) : (
                <CheckCircle size={16} className="text-success-700 shrink-0" />
              )}
              <p
                className={cn(
                  'text-[13px] font-medium',
                  qtyExceeds ? 'text-danger-700' : 'text-success-700'
                )}
              >
                {qtyExceeds
                  ? m.exceedsBanner
                  : m.availableBanner.replace('{n}', String(selectedProduct!.available_qty))}
              </p>
            </div>
          )}

          {/* 5. Notes */}
          <Field label={m.notesLabel}>
            <textarea
              {...register('notes')}
              rows={2}
              className={cn(ipt(false), 'min-h-14 resize-y h-auto py-2')}
            />
          </Field>
        </form>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-border shrink-0">
          <button
            type="submit"
            form="transfer-form"
            disabled={isConfirmDisabled}
            className="inline-flex items-center gap-2 h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:pointer-events-none"
          >
            <Truck size={15} />
            {m.confirm}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 border border-border rounded-lg text-sm text-ink-700 font-medium hover:bg-sand-100 transition-colors"
          >
            {m.cancel}
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

function sel(hasError: boolean) {
  return cn(
    'w-full h-10 px-3 bg-paper border rounded-lg text-sm text-ink-900',
    'focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-50 cursor-pointer',
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

function formatDateEN(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function formatDateAR(iso: string): string {
  const eastern = (s: string) => s.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
  const [y, m, d] = iso.split('-');
  return `${eastern(y)}/${eastern(m)}/${eastern(d)}`;
}
