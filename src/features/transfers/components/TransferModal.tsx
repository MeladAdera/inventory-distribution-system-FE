'use client';

import { useEffect } from 'react';
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from 'react-hook-form';
import { X, Truck, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { useProduct } from '@/features/products/hooks/useProducts';
import type { Product } from '@/features/products/types/products.types';
import type { Shop } from '@/features/shops/types/shops.types';
import { useTransferProducts } from '../hooks/useTransfers';
import type { TransferPrefill } from '../types/transfers.types';

interface TransferFormValues {
  shopId: string;
  items: { productId: string; qty: string }[];
}

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (items: { productId: number; quantity: number }[], shopId?: number) => Promise<void>;
  prefill?: TransferPrefill;
  isSaving?: boolean;
  isAdmin?: boolean;
  shops?: Shop[];
}

interface ModalTranslations {
  productPlaceholder: string;
  qtyHint: string;
  availableBanner: string;
  exceedsBanner: string;
  errProduct: string;
  errQtyRequired: string;
  errQtyPositive: string;
  errQtyExceeds: string;
}

interface ProductRowProps {
  index: number;
  control: Control<TransferFormValues>;
  register: UseFormRegister<TransferFormValues>;
  errors: FieldErrors<TransferFormValues>;
  products: Product[];
  canRemove: boolean;
  onRemove: () => void;
  m: ModalTranslations;
}

function ProductRow({
  index,
  control,
  register,
  errors,
  products,
  canRemove,
  onRemove,
  m,
}: ProductRowProps) {
  const productId = useWatch({ control, name: `items.${index}.productId` });
  const qty = useWatch({ control, name: `items.${index}.qty` });

  const { data: productDetail } = useProduct(productId ? Number(productId) : null);
  const availableQty = productDetail?.data?.current_quantity ?? 0;

  const qtyNum = Number(qty);
  const qtyExceeds = !!productId && qtyNum > 0 && availableQty > 0 && qtyNum > availableQty;
  const showBanner = !!productId && qtyNum > 0 && availableQty > 0;

  type RowErrors = { productId?: { message?: string }; qty?: { message?: string } };
  const rowErrors = errors.items?.[index] as RowErrors | undefined;
  const prodError = rowErrors?.productId;
  const qtyError = rowErrors?.qty;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        {/* Product Select */}
        <div className="flex-1 min-w-0">
          <select
            {...register(`items.${index}.productId`, { required: true })}
            className={sel(!!prodError)}
          >
            <option value="">{m.productPlaceholder}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Qty Input */}
        <div className="w-24 shrink-0">
          <input
            type="number"
            placeholder="0"
            min="1"
            {...register(`items.${index}.qty`, {
              required: m.errQtyRequired,
              validate: (val) => {
                const n = Number(val);
                if (!val || isNaN(n) || n <= 0) return m.errQtyPositive;
                if (availableQty > 0 && n > availableQty) return m.errQtyExceeds;
                return true;
              },
            })}
            className={ipt(!!qtyError || qtyExceeds)}
          />
        </div>

        {/* Remove Button */}
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove"
            className="shrink-0 w-10 h-10 flex items-center justify-center text-ink-400 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
          >
            <Trash2 size={15} />
          </button>
        ) : (
          <div className="w-10 shrink-0" />
        )}
      </div>

      {/* Inline errors */}
      {prodError && <p className="text-xs text-danger-700">{m.errProduct}</p>}
      {qtyError && <p className="text-xs text-danger-700">{qtyError.message}</p>}

      {/* Qty hint */}
      {productId && !qtyError && availableQty > 0 && (
        <p className="text-xs text-ink-500">{m.qtyHint.replace('{n}', String(availableQty))}</p>
      )}

      {/* Availability banner */}
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
            {qtyExceeds ? m.exceedsBanner : m.availableBanner.replace('{n}', String(availableQty))}
          </p>
        </div>
      )}
    </div>
  );
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
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransferFormValues>({
    defaultValues: {
      shopId: '',
      items: [{ productId: '', qty: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedShopId = watch('shopId');

  useEffect(() => {
    if (open) {
      reset({
        shopId: '',
        items: [
          {
            productId: prefill?.productId ? String(prefill.productId) : '',
            qty: prefill?.quantity ? String(prefill.quantity) : '',
          },
        ],
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

  if (!open) return null;

  const isConfirmDisabled = (isAdmin && !watchedShopId) || !!isSaving;

  const onSubmit = handleSubmit(async (data) => {
    const items = data.items.map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.qty),
    }));
    await onSave(items, isAdmin && data.shopId ? Number(data.shopId) : undefined);
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
          className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4.5"
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

          {/* Products Section */}
          <div className="flex flex-col gap-0">
            <p className="text-xs font-medium text-ink-600 mb-3">
              {m.productsLabel}
              <span className="text-danger-700 ms-0.75">*</span>
            </p>

            <div className="flex flex-col">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className={cn('pb-3', index < fields.length - 1 && 'mb-3 border-b border-border')}
                >
                  <ProductRow
                    index={index}
                    control={control}
                    register={register}
                    errors={errors}
                    products={products}
                    canRemove={fields.length > 1}
                    onRemove={() => remove(index)}
                    m={m}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => append({ productId: '', qty: '' })}
              className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
            >
              <Plus size={14} />
              {m.addProduct}
            </button>
          </div>
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
