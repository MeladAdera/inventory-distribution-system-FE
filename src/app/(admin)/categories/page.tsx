'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useAuthStore } from '@/features/auth/store/authStore';
import { CategoriesTableCard } from '@/features/categories/components/CategoriesTableCard';
import { CategoryFormModal } from '@/features/categories/components/CategoryFormModal';
import { CategoryDeleteConfirmModal } from '@/features/categories/components/CategoryDeleteConfirmModal';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/features/categories/types/categories.types';

type ModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; category: Category }
  | { type: 'delete'; category: Category };

export default function CategoriesPage() {
  const { t } = useI18n();
  const c = t.categories;

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const { user } = useAuthStore();

  // Always pass shopId — the backend's ParseIntPipe requires it even when optional in docs.
  // For admin this is the warehouse shopId; for shop users it's their own shopId.
  const shopId = user?.shopId;

  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    deleteCategoryImage,
  } = useCategories(shopId ? { shopId } : undefined);

  // ── Handlers ──────────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{c.page.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {c.page.count.replace('{n}', String(categories.length))}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <Plus size={16} />
          {c.page.addCategory}
        </button>
      </div>

      {/* ── Table ── */}
      <CategoriesTableCard
        categories={categories}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        onAddCategory={() => setModal({ type: 'add' })}
        onEdit={(cat) => setModal({ type: 'edit', category: cat })}
        onDelete={(cat) => setModal({ type: 'delete', category: cat })}
      />

      {/* ── Modals ── */}
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
