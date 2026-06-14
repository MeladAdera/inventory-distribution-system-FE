'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { productFormSchema, type ProductFormData } from '../validations/products.schema';
import type { Product, CreateProductInput, UpdateProductInput } from '../types/products.types';
import type { Category } from '@/features/categories/types/categories.types';
import { ProductThumb } from './ProductThumb';

interface ProductFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onAdd: (data: CreateProductInput) => Promise<void>;
  onEdit: (id: number, data: UpdateProductInput) => Promise<void>;
}

export function ProductFormModal({
  open,
  mode,
  product,
  categories,
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
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: '', description: '', barcode: '', price: 0, category_id: 0 },
  });

  const watchedId = watch('category_id');

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && product) {
      reset({
        name: product.name,
        description: product.description ?? '',
        barcode: product.barcode ?? '',
        price: Number(product.price),
        category_id: product.category_id,
      });
    } else {
      reset({ name: '', description: '', barcode: '', price: 0, category_id: 0 });
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

  const onSubmit = handleSubmit(async (data) => {
    if (mode === 'edit' && product) {
      await onEdit(product.id, {
        name: data.name,
        description: data.description,
        price: data.price,
      });
    } else {
      await onAdd({
        name: data.name,
        description: data.description,
        barcode: data.barcode,
        price: data.price,
        category_id: data.category_id,
      });
    }
    onClose();
  });

  const title = mode === 'add' ? p.form.addTitle : p.form.editTitle;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" onClick={onClose} />

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
          {/* Thumb preview */}
          <div className="flex items-center gap-3.5 p-3.5 border border-dashed border-border rounded-lg bg-sand-100">
            <ProductThumb id={Number(watchedId) || (product?.id ?? 0)} size={44} />
            <p className="text-[13px] text-ink-500">{product?.name ?? p.form.namePlaceholder}</p>
          </div>

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

          {/* Barcode + Category row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={p.form.barcode}>
              <input
                {...register('barcode')}
                placeholder={p.form.barcodePlaceholder}
                className={cn(ipt(false), 'font-mono')}
                dir="ltr"
              />
            </Field>
            <Field
              label={p.form.category}
              required
              error={errors.category_id?.message ? p.form.errCategory : undefined}
            >
              <select
                {...register('category_id', { valueAsNumber: true })}
                className={ipt(!!errors.category_id)}
              >
                <option value={0}>{p.form.categoryPlaceholder}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
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

          {/* Price */}
          <Field
            label={p.form.price}
            required
            error={errors.price?.message ? p.form.errPrice : undefined}
          >
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder={p.form.pricePlaceholder}
              className={cn(ipt(!!errors.price), 'font-mono')}
              dir="ltr"
            />
          </Field>
        </form>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-border shrink-0">
          <button
            type="submit"
            form="product-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
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
