'use client';

import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Box, Loader2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { TypewriterText } from '@/common/components/TypewriterText';
import { useClientOrderProducts } from '../hooks/useClientOrderProducts';
import { OrderCategoryCard } from './order/OrderCategoryCard';
import { SellProductTile } from './sell/SellProductTile';
import { SellTray } from './sell/SellTray';

export function ClientSellPage() {
  const { t, dir } = useI18n();
  const { success: toastSuccess } = useToast();
  const isRtl = dir === 'rtl';
  const sel = t.client.sell;

  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [query, setQuery] = useState('');

  const { categories, isLoading, error } = useClientOrderProducts();

  // ── Derived ────────────────────────────────────────────────────────────────
  const allProducts = categories.flatMap((c) => c.products);
  const selectedCategory = categories.find((c) => c.id === selectedCatId) ?? null;

  const trayItems = allProducts
    .filter((p) => (cart[p.id] ?? 0) > 0)
    .map((p) => ({ product: p, qty: cart[p.id] }));
  const totalUnits = trayItems.reduce((sum, item) => sum + item.qty, 0);

  const filteredCategories = categories.filter(
    (c) => !query || c.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredProducts = (selectedCategory?.products ?? []).filter(
    (p) => !query || p.name.toLowerCase().includes(query.toLowerCase())
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSelectCat(catId: number) {
    setSelectedCatId(catId);
    setQuery('');
  }

  function handleBackToCategories() {
    setSelectedCatId(null);
    setQuery('');
  }

  function setQty(productId: number, value: number) {
    setCart((prev) => {
      if (value <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: value };
    });
  }

  // Tapping a tile adds one unit, capped at the available stock
  function handleTap(productId: number, stock: number) {
    setQty(productId, Math.min((cart[productId] ?? 0) + 1, stock));
  }

  function handleContinue() {
    // Checkout is not wired to the backend yet — UI-only for now
    toastSuccess(sel.toast.stub);
  }

  const BackChevron = isRtl ? ChevronRight : ChevronLeft;
  const tileLabels = { stock: sel.tile.stock, outOfStock: sel.tile.outOfStock };

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]">{sel.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={28} className="text-danger-500" />
        <p className="text-[14px] text-ink-600">{sel.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className={trayItems.length > 0 ? 'max-w-330 mx-auto pb-48' : 'max-w-330 mx-auto'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink-900">
          <TypewriterText phrases={sel.taglines} />
        </h1>
      </div>

      {/* ══ Category grid ══ */}
      {selectedCategory === null && (
        <div>
          <div className="relative mb-6">
            <Search
              size={15}
              className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={sel.search}
              className="ps-8"
            />
          </div>

          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <Box size={32} className="text-ink-300" />
              <p className="text-[14px] text-ink-500">{sel.empty.noCategories}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <OrderCategoryCard
                  key={cat.id}
                  category={cat}
                  cartCount={cat.products.filter((p) => (cart[p.id] ?? 0) > 0).length}
                  onClick={() => handleSelectCat(cat.id)}
                  labels={{ addedBadge: sel.addedBadge, products: sel.products }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ Product tile grid ══ */}
      {selectedCategory && (
        <div>
          <div className="mb-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCategories}
              className="gap-1 mb-2 -ms-1"
            >
              <BackChevron size={15} className="shrink-0" />
              {sel.backToCategories}
            </Button>
            <h2 className="text-[20px] font-semibold text-ink-900">{selectedCategory.name}</h2>
            <p className="text-[13px] text-ink-400 mt-0.5">{sel.tapHint}</p>
          </div>

          <div className="relative mb-5">
            <Search
              size={15}
              className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
            />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={sel.search}
              className="ps-8"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center bg-paper border border-border rounded-xl">
              <Box size={28} className="text-ink-300" />
              <p className="text-[14px] text-ink-500">{sel.empty.noProducts}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
              {filteredProducts.map((product) => (
                <SellProductTile
                  key={product.id}
                  product={product}
                  qty={cart[product.id] ?? 0}
                  onTap={() => handleTap(product.id, product.current_quantity)}
                  labels={tileLabels}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ Fixed bottom tray ══ */}
      <SellTray
        items={trayItems}
        totalUnits={totalUnits}
        onInc={(id) => {
          const stock = allProducts.find((p) => p.id === id)?.current_quantity ?? 0;
          handleTap(id, stock);
        }}
        onDec={(id) => setQty(id, (cart[id] ?? 0) - 1)}
        onRemove={(id) => setQty(id, 0)}
        onContinue={handleContinue}
        labels={{
          title: sel.tray.title,
          totalUnits: sel.tray.totalUnits,
          unitsUnit: sel.tray.unitsUnit,
          continueBtn: sel.tray.continueBtn,
        }}
      />
    </div>
  );
}
