'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { useProduct } from '@/features/products/hooks/useProducts';
import type { Shop } from '@/features/shops/types/shops.types';
import { useTransferProducts } from '../hooks/useTransfers';
import type { TransferPrefill } from '../types/transfers.types';

interface TransferFormValues {
  shopId: string;
  productId: string;
  qty: string;
}

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (productId: number, quantity: number, shopId?: number) => Promise<void>;
  prefill?: TransferPrefill;
  isSaving?: boolean;
  isAdmin?: boolean;
  shops?: Shop[];
}

export function TransferModal({
  open,
  onClose,
  onSave,
  prefill,
  isSaving,
  isAdmin,
  shops = [],
}: TransferModalProps) {
  const { t } = useI18n();
  const m = t.transfers.modal;

  const { data: productsData } = useTransferProducts();
  const products = productsData?.data?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransferFormValues>({
    defaultValues: { shopId: '', productId: '', qty: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        shopId: '',
        productId: prefill?.productId ? String(prefill.productId) : '',
        qty: prefill?.quantity ? String(prefill.quantity) : '',
      });
    }
  }, [open, prefill, reset]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // All watch() and derived hooks must be above the early return
  const watchedProductId = watch('productId');
  const watchedQty = watch('qty');
  const watchedShopId = watch('shopId');

  const { data: productDetail } = useProduct(watchedProductId ? Number(watchedProductId) : null);
  const availableQty = productDetail?.data?.current_quantity ?? 0;

  if (!open) return null;

  const qtyNum = Number(watchedQty);
  const qtyExceeds = !!watchedProductId && qtyNum > 0 && availableQty > 0 && qtyNum > availableQty;
  const showBanner = !!watchedProductId && qtyNum > 0 && availableQty > 0;

  const isConfirmDisabled =
    (isAdmin && !watchedShopId) ||
    !watchedProductId ||
    !watchedQty ||
    qtyNum <= 0 ||
    qtyExceeds ||
    !!isSaving;

  const onSubmit = handleSubmit(async (data) => {
    await onSave(
      Number(data.productId),
      qtyNum,
      isAdmin && data.shopId ? Number(data.shopId) : undefined
    );
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
          {/* Shop Select (Admin only) */}
          {isAdmin && (
            <Field label={m.shopLabel} required error={errors.shopId ? m.errShop : undefined}>
              <select
                {...register('shopId', { required: isAdmin })}
                className={sel(!!errors.shopId)}
              >
                <option value="">{m.shopPlaceholder}</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Product Select */}
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
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>
          </Field>

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
                  if (availableQty > 0 && n > availableQty) return m.errQtyExceeds;
                  return true;
                },
              })}
              className={ipt(!!errors.qty)}
            />
            {watchedProductId && !errors.qty && availableQty > 0 && (
              <p className="text-xs text-ink-500">
                {m.qtyHint.replace('{n}', String(availableQty))}
              </p>
            )}
            {errors.qty && <p className="text-xs text-danger-700">{errors.qty.message}</p>}
          </div>

          {/* Availability Banner */}
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
                  : m.availableBanner.replace('{n}', String(availableQty))}
              </p>
            </div>
          )}
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
            {isSaving ? '...' : m.confirm}
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
