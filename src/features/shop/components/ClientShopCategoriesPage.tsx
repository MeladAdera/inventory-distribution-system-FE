'use client';

import { useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCategories } from '@/features/shared/categories/hooks/useCategories';
import { CategoryFormModal } from '@/features/shared/categories/components/CategoryFormModal';
import { CategoryDeleteConfirmModal } from '@/features/shared/categories/components/CategoryDeleteConfirmModal';
import { ShopCategoryCard } from './categories/ShopCategoryCard';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/features/shared/categories/types/categories.types';

type ModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; category: Category }
  | { type: 'delete'; category: Category };

export function ClientShopCategoriesPage() {
  const { t } = useI18n();
  const c = t.client.shopCategories;

  const { user } = useAuthStore();
  const shopId = user?.shopId;

  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    deleteCategoryImage,
  } = useCategories(shopId ? { shopId } : undefined);

  const handleAdd = async (data: CreateCategoryInput): Promise<{ id: number }> => {
    const result = await createCategory({ data, shopId });
    return result.data;
  };

  const handleEdit = async (id: number, data: UpdateCategoryInput) => {
    await updateCategory({ id, data });
  };

  const handleDelete = async (category: Category) => {
    await deleteCategory(category.id);
  };

  const handleUploadImage = async (id: number, file: File) => {
    await uploadCategoryImage({ id, file });
  };

  const handleDeleteImage = async (id: number) => {
    await deleteCategoryImage(id);
  };

  return (
    <div className="max-w-330 mx-auto pb-20 md:pb-8 px-4 pt-2 md:px-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{c.title}</h1>
          <p className="mt-1 text-sm text-ink-500">{c.subtitle}</p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <Plus size={16} />
          {c.addBtn}
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-sand-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <Tag size={40} className="text-ink-300" />
          <p className="text-[15px] font-semibold text-ink-700">{c.empty.title}</p>
          <p className="text-sm text-ink-400 max-w-xs">{c.empty.sub}</p>
          <button
            onClick={() => setModal({ type: 'add' })}
            className="mt-2 inline-flex items-center gap-2 h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={14} />
            {c.empty.addBtn}
          </button>
        </div>
      )}

      {/* Category grid */}
      {!isLoading && categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((category) => (
            <ShopCategoryCard
              key={category.id}
              category={category}
              isOwned={category.shop_id === shopId}
              warehouseBadgeLabel={c.warehouseBadge}
              onEdit={() => setModal({ type: 'edit', category })}
              onDelete={() => setModal({ type: 'delete', category })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CategoryFormModal
        open={modal.type === 'add' || modal.type === 'edit'}
        mode={modal.type === 'edit' ? 'edit' : 'add'}
        category={modal.type === 'edit' ? modal.category : null}
        onClose={() => setModal({ type: 'none' })}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onUploadImage={handleUploadImage}
        onDeleteImage={handleDeleteImage}
      />
      <CategoryDeleteConfirmModal
        open={modal.type === 'delete'}
        category={modal.type === 'delete' ? modal.category : null}
        onClose={() => setModal({ type: 'none' })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
