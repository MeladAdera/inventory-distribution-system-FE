'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check, Camera, Loader2, Trash2 } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { categorySchema } from '../validations/categories.schema';
import { CategoryThumb } from './CategoryThumb';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types/categories.types';
import type { z } from 'zod';

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  category: Category | null;
  onClose: () => void;
  onAdd: (data: CreateCategoryInput) => Promise<{ id: number }>;
  onEdit: (id: number, data: UpdateCategoryInput) => Promise<void>;
  onUploadImage: (id: number, file: File) => Promise<void>;
  onDeleteImage: (id: number) => Promise<void>;
}

export function CategoryFormModal({
  open,
  mode,
  category,
  onClose,
  onAdd,
  onEdit,
  onUploadImage,
  onDeleteImage,
}: CategoryFormModalProps) {
  const { t } = useI18n();
  const c = t.categories;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && category) {
      reset({ name: category.name });
      setPreviewUrl(category.image_url ?? null);
    } else {
      reset({ name: '' });
      setPreviewUrl(null);
    }
    setPendingFile(null);
    setImageRemoved(false);
  }, [open, mode, category, reset]);

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

    if (mode === 'edit' && category) {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(objectUrl);
      setIsUploadingImage(true);
      try {
        await onUploadImage(category.id, file);
      } finally {
        setIsUploadingImage(false);
      }
    } else {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(objectUrl);
      setPendingFile(file);
    }

    e.target.value = '';
  };

  const handleRemoveImage = async () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
    setImageRemoved(true);

    if (mode === 'edit' && category) {
      setIsDeletingImage(true);
      try {
        await onDeleteImage(category.id);
      } finally {
        setIsDeletingImage(false);
      }
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    if (mode === 'edit' && category) {
      await onEdit(category.id, { name: data.name });
    } else {
      const created = await onAdd({ name: data.name });
      if (pendingFile) {
        await onUploadImage(created.id, pendingFile);
      }
    }
    onClose();
  });

  const title = mode === 'add' ? c.form.addTitle : c.form.editTitle;
  const currentImageUrl = imageRemoved
    ? null
    : (previewUrl ?? (mode === 'edit' ? category?.image_url : null));
  const hasImage = !!currentImageUrl;
  const isBusy = isUploadingImage || isDeletingImage;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className={cn(
          'relative z-10 w-full bg-paper flex flex-col max-h-[90vh]',
          'sm:rounded-xl sm:max-w-120',
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
          id="category-form"
          onSubmit={onSubmit}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        >
          {/* Image upload zone */}
          <div className="flex items-center gap-4 p-3.5 border border-dashed border-border rounded-lg bg-sand-100">
            <div className="relative shrink-0 group">
              <CategoryThumb id={category?.id ?? 0} size={56} imageUrl={currentImageUrl} />
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
                {hasImage ? c.image.change : c.image.upload}
              </button>
              <p className="text-[12px] text-ink-400 mt-0.5">{c.image.hint}</p>
            </div>

            {hasImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isBusy}
                title={c.image.remove}
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-600">
              {c.form.name}
              <span className="text-danger-700 ms-0.75">*</span>
            </label>
            <input
              {...register('name')}
              placeholder={c.form.namePlaceholder}
              className={cn(
                'w-full h-10 px-3 bg-paper border rounded-lg text-sm text-ink-900 placeholder-ink-300',
                'focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-50',
                errors.name ? 'border-danger-700' : 'border-border'
              )}
            />
            {errors.name && <p className="text-xs text-danger-700">{c.form.errName}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-border shrink-0">
          <button
            type="submit"
            form="category-form"
            disabled={isSubmitting || isBusy}
            className="inline-flex items-center gap-2 h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            <Check size={15} />
            {c.form.save}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 border border-border rounded-lg text-sm text-ink-700 font-medium hover:bg-sand-100 transition-colors"
          >
            {c.form.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
