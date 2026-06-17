'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  Box,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { StockStatus } from '@/features/products/types/products.types';
import { useClientInventory } from '../hooks/useClientInventory';
import { CategoryCard } from './inventory/CategoryCard';
import { ProductCard } from './inventory/ProductCard';
import { InventorySaveModal } from './inventory/InventorySaveModal';
import type { StockFilter } from '../types/clientInventory.types';

export function ClientInventoryPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const isRtl = dir === 'rtl';
  const inv = t.client.inventory;

  const { categories, allItems, isLoading, error, adjustInventory, isAdjusting } =
    useClientInventory();

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<number, number>>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const hasChanges = Object.values(changes).some((v) => v !== 0);
  const selectedCat = categories.find((c) => c.id === selectedCatId) ?? null;
  const catItems = selectedCat?.items ?? [];

  const filteredCategories = categories.filter(
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

  async function handleSave() {
    try {
      await Promise.all(
        Object.entries(changes)
          .filter(([, delta]) => delta !== 0)
          .map(([idStr, delta]) =>
            adjustInventory({ id: Number(idStr), data: { adjustment: delta } })
          )
      );
      setChanges({});
      setModalOpen(false);
      toastSuccess(inv.toast.success);
    } catch {
      toastError(inv.toast.error ?? 'Failed to update inventory.');
    }
  }

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
          <h1 className="text-[22px] font-semibold text-ink-900">{inv.title}</h1>
          <p className="text-[13px] text-ink-500 mt-1 max-w-xl">{inv.subtitle}</p>
        </div>
        {hasChanges && (
          <button
            onClick={() => setModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-4 h-10 rounded-lg bg-ink-900 text-amber-500 text-[14px] font-semibold hover:bg-ink-800 transition-colors shrink-0"
          >
            {inv.saveChanges}
          </button>
        )}
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
        (allItems.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <Package size={32} className="text-ink-300" />
            <p className="text-[14px] text-ink-500">{inv.empty.noProducts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                hasEdits={cat.items.some((p) => (changes[p.id] ?? 0) !== 0)}
                labels={{ edited: inv.edited, variants: inv.variants, totalQty: inv.totalQty }}
                onClick={() => handleSelectCat(cat.id)}
              />
            ))}
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

          <div className="mb-5">
            <h2 className="text-[22px] font-semibold text-ink-900">{selectedCat.name}</h2>
            <p className="text-[13px] text-ink-500 mt-0.5">
              {catItems.length} {inv.availableProducts}
            </p>
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
              {filteredProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  delta={changes[item.id] ?? 0}
                  onDelta={(v) => handleDelta(item.id, v)}
                  labels={{
                    currentQty: inv.currentQty,
                    updateQty: inv.updateQty,
                    orderMore: inv.orderMore,
                    statusEnough: inv.statusEnough,
                    statusLow: inv.statusLow,
                    statusOut: inv.statusOut,
                    newQty: inv.newQty ?? 'New quantity',
                  }}
                  onOrderMore={() => router.push(`/client/order?product=${item.product_id}`)}
                />
              ))}
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
        isAdjusting={isAdjusting}
        labels={{
          title: inv.modal.title,
          intro: inv.modal.intro,
          noChanges: inv.modal.noChanges,
          confirm: inv.modal.confirm,
          cancel: inv.modal.cancel,
        }}
      />
    </div>
  );
}
