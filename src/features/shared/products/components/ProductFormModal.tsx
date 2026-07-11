'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check, Camera, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { getErrorMessage } from '@/common/utils/error.utils';
import { cn } from '@/common/utils/cn';
import { productFormSchema, type ProductFormData } from '../validations/products.schema';
import type { Product, CreateProductInput, UpdateProductInput } from '../types/products.types';
import type { Category } from '@/features/shared/categories/types/categories.types';
import { ProductThumb } from './ProductThumb';

interface ProductFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  product: Product | null;
  categories: Category[];
  defaultCategoryId?: number;
  onClose: () => void;
  onAdd: (data: CreateProductInput) => Promise<{ id: number }>;
  onEdit: (id: number, data: UpdateProductInput) => Promise<void>;
  onUploadImage: (id: number, file: File) => Promise<void>;
  onDeleteImage: (id: number) => Promise<void>;
  onStockIn?: (id: number, quantity: number) => Promise<void>;
  onSuccess?: () => void;
}

export function ProductFormModal({
  open,
  mode,
  product,
  categories,
  defaultCategoryId,
  onClose,
  onAdd,
  onEdit,
  onUploadImage,
  onDeleteImage,
  onStockIn,
  onSuccess,
}: ProductFormModalProps) {
  const { t } = useI18n();
  const p = t.products;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      barcode: '',
      price: 0,
      category_id: 0,
      initialQuantity: 0,
    },
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
        cost_price: product.cost_price !== null ? Number(product.cost_price) : undefined,
        category_id: product.category_id,
      });
      setPreviewUrl(product.image_url ?? null);
    } else {
      reset({
        name: '',
        description: '',
        barcode: '',
        price: 0,
        category_id: defaultCategoryId ?? 0,
      });
      setPreviewUrl(null);
    }
    setPendingFile(null);
    setImageRemoved(false);
    setFormError(null);
  }, [open, mode, product, defaultCategoryId, reset]);

  // Clean up object URL to avoid memory leak
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(objectUrl);

    if (mode === 'edit' && product) {
      setIsUploadingImage(true);
      try {
        await onUploadImage(product.id, file);
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      setPendingFile(file);
    }

    e.target.value = '';
  };

  const handleRemoveImage = async () => {
    // Clear visually first so the user sees the change immediately
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setImageRemoved(true);

    if (mode === 'edit' && product) {
      setIsDeletingImage(true);
      try {
        await onDeleteImage(product.id);
      } finally {
        setIsDeletingImage(false);
      }
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);
    try {
      if (mode === 'edit' && product) {
        await onEdit(product.id, {
          name: data.name,
          description: data.description,
          // Selling price is now the per-shop inventory.sale_price (edited on the card),
          // so product edit no longer touches price.
          // Only send cost_price when the field was visible (non-null from API)
          ...(product.cost_price !== null && { cost_price: data.cost_price }),
        });
      } else {
        const created = await onAdd({
          name: data.name,
          description: data.description || undefined,
          barcode: data.barcode || undefined,
          price: data.price,
          cost_price: data.cost_price,
          category_id: data.category_id,
        });
        if (pendingFile) {
          await onUploadImage(created.id, pendingFile);
        }
        if (onStockIn) {
          await onStockIn(created.id, data.initialQuantity ?? 0);
        }
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  // Hide the cost input when the API returned null (warehouse margin is
  // private to shop users) — an empty visible input would overwrite it with 0.
  const showCostPrice = mode === 'add' || product?.cost_price != null;
  // Price (products.price) is only the catalog seed default — set at creation.
  // Selling price is edited per-shop on the inventory card, so hide price on edit.
  const showPrice = mode === 'add';
  const showInitialQty = mode === 'add' && !!onStockIn;
  const priceFieldCount = (showPrice ? 1 : 0) + (showCostPrice ? 1 : 0) + (showInitialQty ? 1 : 0);

  const title = mode === 'add' ? p.form.addTitle : p.form.editTitle;
  const currentImageUrl = imageRemoved
    ? null
    : (previewUrl ?? (mode === 'edit' ? product?.image_url : null));
  const hasImage = !!currentImageUrl;
  const isBusy = isUploadingImage || isDeletingImage;

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
          {/* Image upload zone */}
          <div className="flex items-center gap-4 p-3.5 border border-dashed border-border rounded-lg bg-sand-100">
            <div className="relative shrink-0 group">
              <ProductThumb
                id={Number(watchedId) || (product?.id ?? 0)}
                size={56}
                imageUrl={currentImageUrl}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className={cn(
                  'absolute inset-0 rounded-lg flex items-center justify-center',
                  'bg-ink-900/40 opacity-0 group-hover:opacity-100 transition-opacity',
                  isBusy && 'opacity-100 cursor-not-allowed'
                )}
              >
                {isUploadingImage ? (
                  <Loader2 size={16} className="text-white animate-spin" />
                ) : (
                  <Camera size={16} className="text-white" />
                )}
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="text-[13px] font-medium text-amber-700 hover:text-amber-800 transition-colors disabled:opacity-60"
              >
                {hasImage ? p.image.change : p.image.upload}
              </button>
              <p className="text-[12px] text-ink-400 mt-0.5">{p.image.hint}</p>
            </div>

            {/* Remove button — only when there's an image */}
            {hasImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isBusy}
                title={p.image.remove}
                className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-danger-700 hover:bg-danger-50 transition-colors disabled:opacity-40 shrink-0"
              >
                {isDeletingImage ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
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

          {/* Price + Buying price + Initial quantity row */}
          <div className={cn('grid gap-4', priceFieldCount >= 2 ? 'grid-cols-2' : 'grid-cols-1')}>
            {showPrice && (
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
                  className={cn(
                    ipt(!!errors.price),
                    'font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                  )}
                  dir="ltr"
                />
              </Field>
            )}

            {showCostPrice && (
              <Field
                label={p.form.costPrice}
                error={errors.cost_price?.message ? p.form.errCostPrice : undefined}
              >
                <input
                  {...register('cost_price', {
                    setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)),
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={p.form.costPricePlaceholder}
                  className={cn(
                    ipt(!!errors.cost_price),
                    'font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                  )}
                  dir="ltr"
                />
              </Field>
            )}

            {mode === 'add' && onStockIn && (
              <Field label={p.form.initialQty}>
                <input
                  {...register('initialQuantity', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  className={cn(ipt(false), 'font-mono')}
                  dir="ltr"
                />
              </Field>
            )}
          </div>
        </form>

        {/* Inline error banner */}
        {formError && (
          <div className="mx-6 mb-1 flex items-center gap-2 rounded-lg bg-danger-50 border border-danger-200 px-3.5 py-2.5 text-[13px] text-danger-700">
            <AlertCircle size={15} className="shrink-0" />
            {formError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-border shrink-0">
          <button
            type="submit"
            form="product-form"
            disabled={isSubmitting || isBusy}
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
