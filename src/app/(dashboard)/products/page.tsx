'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { MOCK_PRODUCTS } from '@/features/products/mock/productsData';
import { getProductStatus, CATEGORY_COLORS } from '@/features/products/types/products.types';
import { ProductsTableCard } from '@/features/products/components/ProductsTableCard';
import { ProductFormModal } from '@/features/products/components/ProductFormModal';
import { ProductDetailModal } from '@/features/products/components/ProductDetailModal';
import { RestockModal } from '@/features/products/components/RestockModal';
import { DeleteConfirmModal } from '@/features/products/components/DeleteConfirmModal';
import type { AdminProduct, ProductCategory } from '@/features/products/types/products.types';
import type { AdminProductFormData } from '@/features/products/validations/products.schema';

const PAGE_SIZE = 10;

type ModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; product: AdminProduct }
  | { type: 'view'; product: AdminProduct }
  | { type: 'restock'; product: AdminProduct }
  | { type: 'delete'; product: AdminProduct };

export default function ProductsPage() {
  const { t, locale } = useI18n();
  const p = t.products;

  const [products, setProducts] = useState<AdminProduct[]>(MOCK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  // Simulate initial data fetch
  useEffect(() => {
    const id = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(id);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter]);

  const filtered = useMemo(() => {
    return products.filter((prod) => {
      const name = locale === 'ar' ? prod.name_ar : prod.name_en;
      const matchSearch =
        !search ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        prod.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || prod.category === categoryFilter;
      const status = getProductStatus(prod);
      const matchStatus = !statusFilter || status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter, locale]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── CRUD handlers ──────────────────────────────────────────────────────

  const handleAdd = (data: AdminProductFormData) => {
    const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    const newProduct: AdminProduct = {
      id: nextId,
      name_ar: data.nameAr,
      name_en: data.nameEn ?? '',
      sku: data.sku,
      category: data.category as ProductCategory,
      warehouse_qty: data.warehouseQty,
      cost_price: data.costPrice ?? 0,
      sell_price: data.sellPrice,
      min_stock: data.minStock ?? 0,
      color: CATEGORY_COLORS[data.category as ProductCategory],
      is_active: true,
      description: data.description || undefined,
    };
    setProducts((prev) => [...prev, newProduct]);
    setModal({ type: 'none' });
  };

  const handleEdit = (product: AdminProduct, data: AdminProductFormData) => {
    setProducts((prev) =>
      prev.map((pr) =>
        pr.id === product.id
          ? {
              ...pr,
              name_ar: data.nameAr,
              name_en: data.nameEn ?? '',
              sku: data.sku,
              category: data.category as ProductCategory,
              warehouse_qty: data.warehouseQty,
              cost_price: data.costPrice ?? 0,
              sell_price: data.sellPrice,
              min_stock: data.minStock ?? 0,
              description: data.description || undefined,
            }
          : pr
      )
    );
    setModal({ type: 'none' });
  };

  const handleRestock = (product: AdminProduct, qty: number) => {
    setProducts((prev) =>
      prev.map((pr) =>
        pr.id === product.id ? { ...pr, warehouse_qty: pr.warehouse_qty + qty } : pr
      )
    );
    setModal({ type: 'none' });
  };

  const handleDelete = (product: AdminProduct) => {
    setProducts((prev) => prev.filter((pr) => pr.id !== product.id));
    setModal({ type: 'none' });
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Layer 1: Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{p.page.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {p.page.count.replace('{n}', String(products.length))}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <Plus size={16} />
          {p.page.addProduct}
        </button>
      </div>

      {/* ── Layer 2: Table Card ── */}
      <ProductsTableCard
        products={paginated}
        filteredCount={filtered.length}
        isLoading={isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        startIndex={(page - 1) * PAGE_SIZE}
        search={search}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
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
