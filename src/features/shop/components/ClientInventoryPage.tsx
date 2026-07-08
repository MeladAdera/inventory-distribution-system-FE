'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Box,
  Plus,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useToast } from '@/providers/ToastProvider';
import { useAuthStore } from '@/features/auth/store/authStore';
import { StockStatus } from '@/features/shared/products/types/products.types';
import { TypewriterText } from '@/common/components/TypewriterText';
import { useCategories } from '@/features/shared/categories/hooks/useCategories';
import { CategoryFormModal } from '@/features/shared/categories/components/CategoryFormModal';
import { CategoryDeleteConfirmModal } from '@/features/shared/categories/components/CategoryDeleteConfirmModal';
import { useProducts } from '@/features/shared/products/hooks/useProducts';
import { ProductFormModal } from '@/features/shared/products/components/ProductFormModal';
import { DeleteConfirmModal } from '@/features/shared/products/components/DeleteConfirmModal';
import { ProductSource } from '@/features/shared/products/types/products.types';
import { inventoryApi } from '@/features/shared/inventory/api/inventory.api';
import {
  enqueueStockSave,
  useStockSyncQueue,
} from '@/features/shared/inventory/offline/stockSyncEngine';
import { useClientInventory } from '../hooks/useClientInventory';
import { CategoryCard } from './inventory/CategoryCard';
import { ProductCard } from './inventory/ProductCard';
import { InventorySaveModal } from './inventory/InventorySaveModal';
import type { StockFilter, InventoryCategory } from '../types/clientInventory.types';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/features/shared/categories/types/categories.types';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '@/features/shared/products/types/products.types';

type CatModal =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; category: Category }
  | { type: 'delete'; category: Category };

type ProdModal =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; product: Product }
  | { type: 'delete'; product: Product };

export function ClientInventoryPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const isRtl = dir === 'rtl';
  const inv = t.client.inventory;

  const { user } = useAuthStore();
  const shopId = user?.shopId;

  const [isSaving, setIsSaving] = useState(false);

  const { categories: invCategories, allItems, isLoading, error } = useClientInventory();

  const { itemStatus } = useStockSyncQueue();

  const {
    categories: rawCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    deleteCategoryImage,
  } = useCategories(shopId ? { shopId } : undefined);

  const {
    products: localProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    deleteProductImage,
  } = useProducts({ source: ProductSource.LOCAL });

  // Map product_id → Product for O(1) lookups in View B
  const localProductMap = useMemo(
    () => new Map(localProducts.map((p) => [p.id, p])),
    [localProducts]
  );

  // Merge: own categories always show (so new ones can receive products);
  // warehouse categories only show once the shop has stock from them.
  const mergedCategories = useMemo<InventoryCategory[]>(() => {
    const invMap = new Map(invCategories.map((c) => [c.id, c]));
    return rawCategories
      .filter((cat) => cat.shop_id === shopId || invMap.has(String(cat.id)))
      .map((cat) => {
        const invCat = invMap.get(String(cat.id));
        return (
          invCat ?? { id: String(cat.id), name: cat.name, image_url: cat.image_url, items: [] }
        );
      });
  }, [rawCategories, invCategories, shopId]);

  // Raw category map for CRUD lookups (to get Category object by id)
  const rawCatMap = useMemo(
    () => new Map(rawCategories.map((c) => [String(c.id), c])),
    [rawCategories]
  );

  const [catModal, setCatModal] = useState<CatModal>({ type: 'none' });
  const [prodModal, setProdModal] = useState<ProdModal>({ type: 'none' });
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<number, number>>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const hasChanges = Object.values(changes).some((v) => v !== 0);
  const selectedCat = mergedCategories.find((c) => c.id === selectedCatId) ?? null;
  const catItems = selectedCat?.items ?? [];

  const filteredCategories = mergedCategories.filter(
    (cat) => !query || cat.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProducts = catItems
    .filter((p) => {
      if (filter === 'low') return p.status === StockStatus.LOW_STOCK;
      if (filter === 'out') return p.status === StockStatus.OUT_OF_STOCK;
      return true;
    })
    .filter((p) => !query || p.product_name.toLowerCase().includes(query.toLowerCase()));

  function handleSelectCat(catId: string) {
    setSelectedCatId(catId);
    setQuery('');
    setFilter('all');
  }

  function handleBack() {
    setSelectedCatId(null);
    setQuery('');
  }

  function handleDelta(inventoryId: number, value: number) {
    setChanges((prev) => {
      if (value === 0) {
        const next = { ...prev };
        delete next[inventoryId];
        return next;
      }
      return { ...prev, [inventoryId]: value };
    });
  }

  async function handleSave({
    decreaseNotes,
    increaseNotes,
    isFree,
  }: {
    decreaseNotes: string;
    increaseNotes: string;
    isFree: boolean;
  }) {
    setIsSaving(true);
    try {
      // Unified path: enqueue the batch. When online it flushes immediately;
      // when offline it's durably queued and syncs on reconnect. Optimistic UI,
      // pending badges, and conflict surfacing are all driven by the queue —
      // so we don't call receiptsApi/inventoryApi or invalidate here anymore.
      await enqueueStockSave({
        queryClient,
        changes,
        items: allItems,
        decreaseNotes,
        increaseNotes,
        isFree,
        shopId,
      });
      setChanges({});
      setModalOpen(false);
    } catch (err) {
      toastError(getErrorMessage(err));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }

  // Invalidate the internal inventory categories cache after any category mutation
  async function invalidateInvCategories() {
    await queryClient.invalidateQueries({ queryKey: ['client-inventory-categories'] });
  }

  const handleCategoryAdd = async (data: CreateCategoryInput): Promise<{ id: number }> => {
    const result = await createCategory({ data, shopId });
    await invalidateInvCategories();
    return result.data;
  };

  const handleCategoryEdit = async (id: number, data: UpdateCategoryInput) => {
    await updateCategory({ id, data });
    await invalidateInvCategories();
  };

  const handleCategoryDelete = async (category: Category) => {
    await deleteCategory(category.id);
    await invalidateInvCategories();
  };

  const handleUploadCategoryImage = async (id: number, file: File) => {
    await uploadCategoryImage({ id, file });
    await invalidateInvCategories();
  };

  const handleDeleteCategoryImage = async (id: number) => {
    await deleteCategoryImage(id);
    await invalidateInvCategories();
  };

  // Invalidate the internal inventory products + items cache after any product mutation
  async function invalidateInvProducts() {
    await queryClient.invalidateQueries({ queryKey: ['client-inventory-products'] });
    await queryClient.invalidateQueries({ queryKey: ['client-inventory'] });
  }

  const handleProductAdd = async (data: CreateProductInput): Promise<{ id: number }> => {
    const result = await createProduct({ data, shop_id: shopId });
    await invalidateInvProducts();
    return result.data;
  };

  const handleProductStockIn = async (productId: number, quantity: number) => {
    await inventoryApi.stockIn({ productId, quantity });
    await invalidateInvProducts();
  };

  const handleProductEdit = async (id: number, data: UpdateProductInput) => {
    await updateProduct({ id, data });
    await invalidateInvProducts();
  };

  const handleProductDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      await invalidateInvProducts();
      toastSuccess(inv.products.toast.deleteSuccess);
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  };

  const handleUploadProductImage = async (id: number, file: File) => {
    await uploadProductImage({ id, file });
    await invalidateInvProducts();
  };

  const handleDeleteProductImage = async (id: number) => {
    await deleteProductImage(id);
    await invalidateInvProducts();
  };

  const FILTER_TABS: { key: StockFilter; label: string }[] = [
    { key: 'all', label: inv.filters.all },
    { key: 'low', label: inv.filters.low },
    { key: 'out', label: inv.filters.out },
  ];

  const BackChevron = isRtl ? ChevronRight : ChevronLeft;

  if (isLoading) {
    return (
      <div className="max-w-330 mx-auto flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={28} className="text-ink-400 animate-spin" />
        <p className="text-[14px] text-ink-500">{inv.loading ?? 'Loading inventory…'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-330 mx-auto flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertTriangle size={28} className="text-danger-500" />
        <p className="text-[14px] text-ink-600">{inv.errorMsg ?? 'Failed to load inventory.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">
            <TypewriterText phrases={inv.taglines} />
          </h1>
          <p className="text-[13px] text-ink-400 mt-1 max-w-xl">{inv.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Add category button — only in category grid view */}
          {!selectedCatId && (
            <button
              onClick={() => setCatModal({ type: 'add' })}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-border bg-paper text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
            >
              <Plus size={15} />
              {inv.categories.addBtn}
            </button>
          )}

          {/* Save inventory changes button */}
          {hasChanges && (
            <button
              onClick={() => setModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 h-10 rounded-lg bg-ink-900 text-amber-500 text-[14px] font-semibold hover:bg-ink-800 transition-colors"
            >
              {inv.saveChanges}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center h-10 bg-paper border border-border rounded-lg px-3 gap-2 mb-6">
        <Search size={15} className="text-ink-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={inv.search}
          className="flex-1 text-[13px] text-ink-900 placeholder:text-ink-400 bg-transparent outline-none"
        />
      </div>

      {/* View A — Category grid */}
      {!selectedCatId &&
        (allItems.length === 0 && mergedCategories.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <Package size={32} className="text-ink-300" />
            <p className="text-[14px] text-ink-500">{inv.empty.noProducts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => {
              const rawCat = rawCatMap.get(cat.id);
              const isOwned = rawCat ? rawCat.shop_id === shopId : false;
              return (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  hasEdits={cat.items.some((p) => (changes[p.id] ?? 0) !== 0)}
                  labels={{
                    edited: inv.edited,
                    variants: inv.variants,
                    totalQty: inv.totalQty,
                    warehouseBadge: inv.categories.warehouseBadge,
                    noProducts: inv.categories.noProducts,
                  }}
                  onClick={() => handleSelectCat(cat.id)}
                  isOwned={isOwned}
                  onEdit={
                    isOwned && rawCat
                      ? () => setCatModal({ type: 'edit', category: rawCat })
                      : undefined
                  }
                  onDelete={
                    isOwned && rawCat
                      ? () => setCatModal({ type: 'delete', category: rawCat })
                      : undefined
                  }
                />
              );
            })}
          </div>
        ))}

      {/* View B — Product list */}
      {selectedCatId && selectedCat && (
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-amber-700 transition-colors mb-5"
          >
            <BackChevron size={16} className="text-ink-400 shrink-0" />
            {selectedCat.name}
          </button>

          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-[22px] font-semibold text-ink-900">{selectedCat.name}</h2>
              <p className="text-[13px] text-ink-500 mt-0.5">
                {catItems.length} {inv.availableProducts}
              </p>
            </div>
            <button
              onClick={() => setProdModal({ type: 'add' })}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-paper text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors shrink-0"
            >
              <Plus size={14} />
              {inv.products.addBtn}
            </button>
          </div>

          <div className="flex items-center gap-2 mb-5">
            {FILTER_TABS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors',
                  filter === f.key
                    ? 'bg-ink-900 text-amber-500'
                    : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center bg-paper border border-border rounded-xl">
              <Box size={28} className="text-ink-300" />
              <p className="text-[14px] text-ink-500">{inv.empty.noCatProducts}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((item) => {
                const localProd = localProductMap.get(item.product_id);
                return (
                  <ProductCard
                    key={item.id}
                    item={item}
                    delta={changes[item.id] ?? 0}
                    onDelta={(v) => handleDelta(item.id, v)}
                    syncStatus={itemStatus.get(item.id)}
                    labels={{
                      currentQty: inv.currentQty,
                      updateQty: inv.updateQty,
                      orderMore: inv.orderMore,
                      statusEnough: inv.statusEnough,
                      statusLow: inv.statusLow,
                      statusOut: inv.statusOut,
                      newQty: inv.newQty ?? 'New quantity',
                      pendingSync: t.offline.badge.pendingSync,
                      conflict: t.offline.badge.conflict,
                    }}
                    onOrderMore={() => router.push(`/client/order?product=${item.product_id}`)}
                    onEdit={
                      localProd
                        ? () => setProdModal({ type: 'edit', product: localProd })
                        : undefined
                    }
                    onDelete={
                      localProd
                        ? () => setProdModal({ type: 'delete', product: localProd })
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mobile sticky save bar */}
      {hasChanges && (
        <div className="sm:hidden fixed bottom-14 inset-x-0 z-30 px-4 pb-3 pt-2 bg-page border-t border-border">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full h-11 rounded-lg bg-ink-900 text-amber-500 text-[14px] font-semibold hover:bg-ink-800 transition-colors"
          >
            {inv.saveChanges}
          </button>
        </div>
      )}

      <InventorySaveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSave}
        allItems={allItems}
        changes={changes}
        isSaving={isSaving}
        labels={{
          title: inv.modal.title,
          intro: inv.modal.intro,
          noChanges: inv.modal.noChanges,
          confirm: inv.modal.confirm,
          cancel: inv.modal.cancel,
          decreaseSection: inv.modal.decreaseSection,
          increaseSection: inv.modal.increaseSection,
          notesPlaceholder: inv.modal.notesPlaceholder,
          receiptNotesLabel: inv.modal.receiptNotesLabel,
          increaseNotesLabel: inv.modal.increaseNotesLabel,
          price: inv.modal.price,
          markFreeLabel: inv.modal.markFreeLabel,
          markFreeHint: inv.modal.markFreeHint,
        }}
      />

      {/* Category modals */}
      <CategoryFormModal
        open={catModal.type === 'add' || catModal.type === 'edit'}
        mode={catModal.type === 'edit' ? 'edit' : 'add'}
        category={catModal.type === 'edit' ? catModal.category : null}
        onClose={() => setCatModal({ type: 'none' })}
        onAdd={handleCategoryAdd}
        onEdit={handleCategoryEdit}
        onUploadImage={handleUploadCategoryImage}
        onDeleteImage={handleDeleteCategoryImage}
      />
      <CategoryDeleteConfirmModal
        open={catModal.type === 'delete'}
        category={catModal.type === 'delete' ? catModal.category : null}
        onClose={() => setCatModal({ type: 'none' })}
        onConfirm={handleCategoryDelete}
      />

      {/* Product modals */}
      <ProductFormModal
        open={prodModal.type === 'add' || prodModal.type === 'edit'}
        mode={prodModal.type === 'edit' ? 'edit' : 'add'}
        product={prodModal.type === 'edit' ? prodModal.product : null}
        categories={rawCategories}
        defaultCategoryId={selectedCatId ? parseInt(selectedCatId, 10) : undefined}
        onClose={() => setProdModal({ type: 'none' })}
        onAdd={handleProductAdd}
        onStockIn={handleProductStockIn}
        onEdit={handleProductEdit}
        onUploadImage={handleUploadProductImage}
        onDeleteImage={handleDeleteProductImage}
        onSuccess={() =>
          toastSuccess(
            prodModal.type === 'edit'
              ? inv.products.toast.editSuccess
              : inv.products.toast.createSuccess
          )
        }
      />
      <DeleteConfirmModal
        open={prodModal.type === 'delete'}
        product={prodModal.type === 'delete' ? prodModal.product : null}
        onClose={() => setProdModal({ type: 'none' })}
        onConfirm={handleProductDelete}
      />
    </div>
  );
}
