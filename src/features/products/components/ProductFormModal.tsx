'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check, Image } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { adminProductFormSchema, type AdminProductFormData } from '../validations/products.schema';
import { CATEGORY_COLORS, type AdminProduct, type ProductCategory } from '../types/products.types';
import { ProductThumb } from './ProductThumb';

interface ProductFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  product: AdminProduct | null;
  onClose: () => void;
  onAdd: (data: AdminProductFormData) => void;
  onEdit: (product: AdminProduct, data: AdminProductFormData) => void;
}

const CATEGORIES: ProductCategory[] = ['bev', 'snk', 'dry', 'cln', 'can', 'bky'];

export function ProductFormModal({
  open,
  mode,
  product,
  onClose,
  onAdd,
  onEdit,
}: ProductFormModalProps) {
  const { t } = useI18n();
  const p = t.products;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdminProductFormData>({
    resolver: zodResolver(adminProductFormSchema),
    defaultValues: {
      nameAr: '',
      nameEn: '',
      sku: '',
      category: 'bev',
      description: '',
      costPrice: 0,
      sellPrice: 0,
      warehouseQty: 0,
      minStock: 0,
    },
  });

  const watchCategory = watch('category') as ProductCategory;
  const thumbColor = product?.color ?? CATEGORY_COLORS[watchCategory] ?? '#DCEBE9';

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && product) {
      reset({
        nameAr: product.name_ar,
        nameEn: product.name_en,
        sku: product.sku,
        category: product.category,
        description: product.description ?? '',
        costPrice: product.cost_price,
        sellPrice: product.sell_price,
        warehouseQty: product.warehouse_qty,
        minStock: product.min_stock,
      });
    } else {
      reset({
        nameAr: '',
        nameEn: '',
        sku: '',
        category: 'bev',
        description: '',
        costPrice: 0,
        sellPrice: 0,
        warehouseQty: 0,
        minStock: 0,
      });
    }
  }, [open, mode, product, reset]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const onSubmit = handleSubmit((data) => {
    if (mode === 'edit' && product) {
      onEdit(product, data);
    } else {
      onAdd(data);
    }
  });

  const title = mode === 'add' ? p.form.addTitle : p.form.editTitle;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full bg-paper flex flex-col max-h-[90vh]',
          'sm:rounded-xl sm:max-w-160',
          'rounded-t-2xl sm:rounded-t-xl',
          'animate-pop-in'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          id="product-form"
          onSubmit={onSubmit}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        >
          {/* Image upload zone */}
          <div>
            <label className="text-xs font-medium text-ink-600 block mb-1.5">{p.form.image}</label>
            <div className="flex items-center gap-3.5 p-3.5 border border-dashed border-border rounded-lg bg-sand-100 hover:border-amber-600 transition-colors cursor-pointer">
              <ProductThumb color={thumbColor} size={44} />
              <div className="w-8 h-8 rounded-lg bg-paper border border-border flex items-center justify-center text-ink-500">
                <Image size={20} />
              </div>
              <p className="text-[13px] text-ink-500">{p.form.imageDrag}</p>
            </div>
          </div>

          {/* Names row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={p.form.nameAr}
              required
              error={errors.nameAr?.message ? p.form.errNameAr : undefined}
            >
              <input
                {...register('nameAr')}
                placeholder={p.form.nameArPlaceholder}
                className={ipt(!!errors.nameAr)}
              />
            </Field>
            <Field label={p.form.nameEn}>
              <input
                {...register('nameEn')}
                placeholder={p.form.nameEnPlaceholder}
                className={ipt(false)}
                dir="ltr"
              />
            </Field>
          </div>

          {/* SKU + Category row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={p.form.sku}
              required
              error={errors.sku?.message ? p.form.errSku : undefined}
            >
              <input
                {...register('sku')}
                placeholder={p.form.skuPlaceholder}
                className={cn(ipt(!!errors.sku), 'font-mono')}
                dir="ltr"
              />
            </Field>
            <Field label={p.form.category} required>
              <select {...register('category')} className={ipt(false)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {p.toolbar.categories[cat]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Description */}
          <Field label={p.form.description}>
            <textarea
              {...register('description')}
              rows={3}
              className={cn(ipt(false), 'min-h-18 resize-y h-auto py-2')}
            />
          </Field>

          {/* Cost + Sell price row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={p.form.costPrice}>
              <input
                {...register('costPrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder={p.form.pricePlaceholder}
                className={cn(ipt(false), 'font-mono')}
                dir="ltr"
              />
            </Field>
            <Field
              label={p.form.sellPrice}
              required
              error={errors.sellPrice?.message ? p.form.errSellPrice : undefined}
            >
              <input
                {...register('sellPrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                placeholder={p.form.pricePlaceholder}
                className={cn(ipt(!!errors.sellPrice), 'font-mono')}
                dir="ltr"
              />
            </Field>
          </div>

          {/* Qty + Min stock row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={p.form.initialQty}
              required
              error={errors.warehouseQty?.message ? p.form.errQty : undefined}
            >
              <input
                {...register('warehouseQty', { valueAsNumber: true })}
                type="number"
                min="0"
                placeholder={p.form.qtyPlaceholder}
                className={cn(ipt(!!errors.warehouseQty), 'font-mono')}
                dir="ltr"
              />
            </Field>
            <Field label={p.form.minStock}>
              <input
                {...register('minStock', { valueAsNumber: true })}
                type="number"
                min="0"
                placeholder={p.form.qtyPlaceholder}
                className={cn(ipt(false), 'font-mono')}
                dir="ltr"
              />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-border shrink-0">
          <button
            type="submit"
            form="product-form"
            className="inline-flex items-center gap-2 h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
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
