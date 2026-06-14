'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useAuthStore } from '@/features/auth/store/authStore';
import { UserRole } from '@/features/auth/types/enums';
import { tokenUtils } from '@/features/auth/utils/token.utils';
import { inventoryApi } from '@/features/inventory/api/inventory.api';
import { ProductsTableCard } from '@/features/products/components/ProductsTableCard';
import { ProductFormModal } from '@/features/products/components/ProductFormModal';
import { ProductDetailModal } from '@/features/products/components/ProductDetailModal';
import { RestockModal } from '@/features/products/components/RestockModal';
import { DeleteConfirmModal } from '@/features/products/components/DeleteConfirmModal';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '@/features/products/types/products.types';

const PAGE_SIZE = 10;

type ModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; product: Product }
  | { type: 'view'; product: Product }
  | { type: 'restock'; product: Product }
  | { type: 'delete'; product: Product };

export default function ProductsPage() {
  const { t } = useI18n();
  const p = t.products;

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, sourceFilter]);

  const { products, total, isLoading, createProduct, updateProduct, deleteProduct } = useProducts({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    source: (sourceFilter as Product['source']) || undefined,
  });

  const { user } = useAuthStore();
  const categoryShopId = user?.role === UserRole.WAREHOUSE_ADMIN ? user.shopId : undefined;
  const { categories } = useCategories(categoryShopId ? { shopId: categoryShopId } : undefined);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAdd = async (input: CreateProductInput) => {
    const shop_id = user?.shopId ?? tokenUtils.getShopId();
    await createProduct({ data: input, shop_id });
  };

  const handleEdit = async (id: number, input: UpdateProductInput) => {
    await updateProduct({ id, data: input });
  };

  const handleDelete = async (product: Product) => {
    await deleteProduct(product.id);
  };

  const handleRestock = async (product: Product, qty: number) => {
    await inventoryApi.stockIn({ productId: product.id, quantity: qty });
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{p.page.title}</h1>
          <p className="mt-1 text-sm text-ink-500">{p.page.count.replace('{n}', String(total))}</p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <Plus size={16} />
          {p.page.addProduct}
        </button>
      </div>

      {/* ── Table ── */}
      <ProductsTableCard
        products={products}
        total={total}
        isLoading={isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        startIndex={(page - 1) * PAGE_SIZE}
        search={search}
        sourceFilter={sourceFilter}
        onSearchChange={setSearch}
        onSourceChange={setSourceFilter}
        onPageChange={setPage}
        onAddProduct={() => setModal({ type: 'add' })}
        onView={(prod) => setModal({ type: 'view', product: prod })}
        onEdit={(prod) => setModal({ type: 'edit', product: prod })}
        onRestock={(prod) => setModal({ type: 'restock', product: prod })}
        onDelete={(prod) => setModal({ type: 'delete', product: prod })}
      />

      {/* ── Modals ── */}
      <ProductFormModal
        open={modal.type === 'add' || modal.type === 'edit'}
        mode={modal.type === 'edit' ? 'edit' : 'add'}
        product={modal.type === 'edit' ? modal.product : null}
        categories={categories}
        onClose={() => setModal({ type: 'none' })}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />
      <ProductDetailModal
        open={modal.type === 'view'}
        product={modal.type === 'view' ? modal.product : null}
        onClose={() => setModal({ type: 'none' })}
      />
      <RestockModal
        open={modal.type === 'restock'}
        product={modal.type === 'restock' ? modal.product : null}
        onClose={() => setModal({ type: 'none' })}
        onConfirm={handleRestock}
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
