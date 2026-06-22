'use client';

import { useState } from 'react';
import { Plus, Box } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { ProductFormModal } from '@/features/products/components/ProductFormModal';
import { DeleteConfirmModal } from '@/features/products/components/DeleteConfirmModal';
import { ProductSource } from '@/features/products/types/products.types';
import { ShopProductCard } from './products/ShopProductCard';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '@/features/products/types/products.types';

type ModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; product: Product }
  | { type: 'delete'; product: Product };

export function ClientShopProductsPage() {
  const { t } = useI18n();
  const c = t.client.shopProducts;

  const { user } = useAuthStore();
  const shopId = user?.shopId;

  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  const {
    products,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    deleteProductImage,
  } = useProducts({ source: ProductSource.LOCAL });

  const { categories } = useCategories(shopId ? { shopId } : undefined);

  const handleAdd = async (data: CreateProductInput): Promise<{ id: number }> => {
    const result = await createProduct({ data, shop_id: shopId });
    return result.data;
  };

  const handleEdit = async (id: number, data: UpdateProductInput) => {
    await updateProduct({ id, data });
  };

  const handleDelete = async (product: Product) => {
    await deleteProduct(product.id);
  };

  const handleUploadImage = async (id: number, file: File) => {
    await uploadProductImage({ id, file });
  };

  const handleDeleteImage = async (id: number) => {
    await deleteProductImage(id);
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
            <div key={i} className="h-52 rounded-xl bg-sand-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <Box size={40} className="text-ink-300" />
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

      {/* Product grid */}
      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((product) => (
            <ShopProductCard
              key={product.id}
              product={product}
              onEdit={() => setModal({ type: 'edit', product })}
              onDelete={() => setModal({ type: 'delete', product })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        open={modal.type === 'add' || modal.type === 'edit'}
        mode={modal.type === 'edit' ? 'edit' : 'add'}
        product={modal.type === 'edit' ? modal.product : null}
        categories={categories}
        onClose={() => setModal({ type: 'none' })}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onUploadImage={handleUploadImage}
        onDeleteImage={handleDeleteImage}
      />
      <DeleteConfirmModal
        open={modal.type === 'delete'}
        product={modal.type === 'delete' ? modal.product : null}
        onClose={() => setModal({ type: 'none' })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
