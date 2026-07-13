'use client';

import { useMemo, useState } from 'react';
import { Search, Box, Loader2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useCatalog } from '../hooks/useCatalog';
import { CategoryChips } from './catalog/CategoryChips';
import { CatalogProductCard } from './catalog/CatalogProductCard';
import { OpeningStockSheet } from './catalog/OpeningStockSheet';
import type { CatalogProduct } from '../types/catalog.types';

export function ClientCatalogPage() {
  const { t } = useI18n();
  const cat = t.client.catalog;
  const { success: toastSuccess, error: toastError } = useToast();

  const {
    categories,
    isEmpty,
    isLoading,
    error,
    addingIds,
    addToInventory,
    setOpeningStock,
    isSettingStock,
  } = useCatalog();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [stockTarget, setStockTarget] = useState<{
    product: CatalogProduct;
    inventoryId: number;
  } | null>(null);

  const chipNames = categories.map((c) => c.name);

  const visibleCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => activeCategory === null || c.name === activeCategory)
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (p) =>
            !q || p.name.toLowerCase().includes(q) || (p.barcode ?? '').toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, activeCategory, query]);

  async function handleAdd(product: CatalogProduct) {
    try {
      const row = await addToInventory(product.id);
      toastSuccess(
        cat.toast.added.replace('{name}', product.name),
        row
          ? {
              label: cat.toast.setStock,
              onClick: () => setStockTarget({ product, inventoryId: row.id }),
            }
          : undefined
      );
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  }

  async function handleSaveOpeningStock(quantity: number) {
    if (!stockTarget) return;
    try {
      await setOpeningStock({
        productId: stockTarget.product.id,
        inventoryId: stockTarget.inventoryId,
        quantity,
      });
      setStockTarget(null);
      toastSuccess(cat.toast.stockSet);
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  }

  const cardLabels = {
    add: cat.card.add,
    adding: cat.card.adding,
    added: cat.card.added,
    notInShop: cat.card.notInShop,
    inShopStock: cat.card.inShopStock,
    inShopOut: cat.card.inShopOut,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]">{cat.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={28} className="text-danger-500" />
        <p className="text-[14px] text-ink-600">{cat.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink-900">{cat.title}</h1>
        <p className="text-[13px] text-ink-400 mt-1 max-w-xl">{cat.subtitle}</p>
      </div>

      {/* Search */}
      <div className="flex items-center h-10 bg-paper border border-border rounded-lg px-3 gap-2 mb-4">
        <Search size={15} className="text-ink-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={cat.search}
          className="flex-1 text-[13px] text-ink-900 placeholder:text-ink-400 bg-transparent outline-none"
        />
      </div>

      {/* Category chips */}
      {!isEmpty && (
        <div className="mb-5">
          <CategoryChips
            categories={chipNames}
            active={activeCategory}
            onSelect={setActiveCategory}
            allLabel={cat.allChip}
          />
        </div>
      )}

      {/* Catalog */}
      {isEmpty ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <Box size={32} className="text-ink-300" />
          <p className="text-[14px] text-ink-500">{cat.empty.noProducts}</p>
        </div>
      ) : visibleCategories.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3 text-center bg-paper border border-border rounded-xl">
          <Box size={28} className="text-ink-300" />
          <p className="text-[14px] text-ink-500">{cat.empty.noMatch}</p>
          <button
            onClick={() => {
              setQuery('');
              setActiveCategory(null);
            }}
            className="text-[13px] font-medium text-amber-700 hover:text-amber-600 transition-colors"
          >
            {cat.empty.clearSearch}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {visibleCategories.map((category) => (
            <section key={category.name}>
              <div className="flex items-baseline justify-between mb-2.5 px-0.5">
                <h2 className="text-[15px] font-semibold text-ink-700">{category.name}</h2>
                <span className="text-[12px] text-ink-400 tabular-nums">
                  {category.items.length} {cat.productsCount}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {category.items.map((item) => (
                  <CatalogProductCard
                    key={item.id}
                    item={item}
                    isAdding={addingIds.has(item.id)}
                    onAdd={() => handleAdd(item)}
                    labels={cardLabels}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <OpeningStockSheet
        open={stockTarget !== null}
        productName={stockTarget?.product.name ?? ''}
        isSaving={isSettingStock}
        onClose={() => setStockTarget(null)}
        onSave={handleSaveOpeningStock}
        labels={{
          title: cat.sheet.title,
          hint: cat.sheet.hint,
          save: cat.sheet.save,
          skip: cat.sheet.skip,
        }}
      />
    </div>
  );
}
