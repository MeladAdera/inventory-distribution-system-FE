'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, Box, Loader2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/common/utils/error.utils';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { TypewriterText } from '@/common/components/TypewriterText';
import { useAuthStore } from '@/features/auth/store/authStore';
import { enqueueStockSave } from '@/features/shared/inventory/offline/stockSyncEngine';
import { getIsOnline, useOnlineStatus } from '@/common/offline/connectivity/useOnlineStatus';
import { multiplyMoney, sumMoney } from '@/common/utils/money';
import { useCustomers } from '@/features/shop/customers';
import { useOpenShift } from '@/features/shop/shifts/hooks/useOpenShift';
import { SellShiftGate } from '@/features/shop/shifts/components/SellShiftGate';
import { useClientInventory } from '../hooks/useClientInventory';
import { CategoryCard } from './inventory/CategoryCard';
import { SellProductTile } from './sell/SellProductTile';
import { SellTray } from './sell/SellTray';
import { SellConfirmModal, type SellConfirmPayload } from './sell/SellConfirmModal';

// Loaded eagerly (not only when the modal opens) so the list is already in the
// persisted cache when the shop goes offline. Filtering happens client-side in
// the picker, which keeps offline search identical to online.
const CUSTOMER_PICKER_LIMIT = 100;

export function ClientSellPage() {
  const { t, dir } = useI18n();
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const isRtl = dir === 'rtl';
  const sel = t.client.sell;
  const inv = t.client.inventory;

  const shopId = useAuthStore((s) => s.user?.shopId);

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The shop's own inventory: warehouse-bought stock and local products alike.
  // Only stocked items appear — rows carry the inventory id POST /receipts needs.
  const { categories, allItems, isLoading, error } = useClientInventory();

  // Credit sales need someone to owe the money.
  const { customers } = useCustomers({ page: 1, limit: CUSTOMER_PICKER_LIMIT });
  const isOnline = useOnlineStatus();

  // The till is gated on a shift being open, and each sale is filed against it.
  const { openShift, shouldBlockSelling } = useOpenShift();

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedCategory = categories.find((c) => c.id === selectedCatId) ?? null;

  const trayItems = allItems
    .filter((item) => (cart[item.id] ?? 0) > 0)
    .map((item) => ({ item, qty: cart[item.id] }));
  const totalUnits = trayItems.reduce((sum, entry) => sum + entry.qty, 0);
  const totalPrice = trayItems.reduce(
    (sum, entry) => sum + Number(entry.item.sale_price) * entry.qty,
    0
  );
  // The same total, computed exactly in minor units. Credit sales compare the
  // amount paid against this, and a float sum can land a cent off the displayed
  // figure — which would let a "paid in full" amount read as exceeding the total.
  const totalMoney = sumMoney(
    trayItems.map(({ item, qty }) => multiplyMoney(item.sale_price ?? 0, qty))
  );

  const filteredCategories = categories.filter(
    (c) => !query || c.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredItems = (selectedCategory?.items ?? []).filter(
    (item) => !query || item.product_name.toLowerCase().includes(query.toLowerCase())
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSelectCat(catId: string) {
    setSelectedCatId(catId);
    setQuery('');
  }

  function handleBackToCategories() {
    setSelectedCatId(null);
    setQuery('');
  }

  function setQty(inventoryId: number, value: number) {
    setCart((prev) => {
      if (value <= 0) {
        const next = { ...prev };
        delete next[inventoryId];
        return next;
      }
      return { ...prev, [inventoryId]: value };
    });
  }

  // Tapping a tile adds one unit, capped at the available stock
  function handleTap(inventoryId: number, stock: number) {
    setQty(inventoryId, Math.min((cart[inventoryId] ?? 0) + 1, stock));
  }

  async function handleConfirm({ notes, isFree, customerId, paidAmount }: SellConfirmPayload) {
    setIsSubmitting(true);
    try {
      // Same offline-first path the inventory page uses for stock decreases:
      // one atomic POST /receipts when online, durably queued when offline.
      // customerId/paidAmount ride inside that same request, so a credit sale
      // and its debt are created together or not at all.
      const wasOnline = getIsOnline();
      await enqueueStockSave({
        queryClient,
        changes: Object.fromEntries(trayItems.map(({ item, qty }) => [item.id, -qty])),
        items: allItems,
        decreaseNotes: notes,
        isFree,
        customerId,
        paidAmount,
        shopId,
        // Snapshotted now, not resolved at replay time: by the time the queue
        // drains, this shift may have closed and another opened, and the money
        // would land in the wrong drawer.
        shiftSessionId: openShift?.id,
      });
      setCart({});
      setModalOpen(false);
      toastSuccess(wasOnline ? sel.toast.success : sel.toast.queued);
    } catch (err) {
      toastError(getErrorMessage(err));
      throw err;
    } finally {
      setIsSubmitting(false);
    }
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

  // Replaces the till, rather than disabling it: a greyed-out grid invites
  // hunting for what is broken, where this names the missing step.
  if (shouldBlockSelling) {
    return <SellShiftGate labels={t.shifts.gate} />;
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
            <>
              {/* Mobile — compact square tiles; column count is fluid, not hardcoded */}
              <div className="grid sm:hidden grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2.5">
                {filteredCategories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    hasEdits={cat.items.some((item) => (cart[item.id] ?? 0) > 0)}
                    onClick={() => handleSelectCat(cat.id)}
                    compact
                    labels={{
                      edited: sel.addedBadge,
                      variants: inv.variants,
                      totalQty: inv.totalQty,
                      noProducts: sel.empty.noProducts,
                    }}
                  />
                ))}
              </div>

              {/* Tablet/desktop — full info card */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    hasEdits={cat.items.some((item) => (cart[item.id] ?? 0) > 0)}
                    onClick={() => handleSelectCat(cat.id)}
                    labels={{
                      edited: sel.addedBadge,
                      variants: inv.variants,
                      totalQty: inv.totalQty,
                      noProducts: sel.empty.noProducts,
                    }}
                  />
                ))}
              </div>
            </>
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

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center bg-paper border border-border rounded-xl">
              <Box size={28} className="text-ink-300" />
              <p className="text-[14px] text-ink-500">{sel.empty.noProducts}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
              {filteredItems.map((item) => (
                <SellProductTile
                  key={item.id}
                  item={item}
                  qty={cart[item.id] ?? 0}
                  onTap={() => handleTap(item.id, item.current_quantity)}
                  labels={tileLabels}
                  categoryIcon={selectedCategory.icon}
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
        totalPrice={totalPrice}
        onInc={(id) => {
          const stock = allItems.find((item) => item.id === id)?.current_quantity ?? 0;
          handleTap(id, stock);
        }}
        onDec={(id) => setQty(id, (cart[id] ?? 0) - 1)}
        onRemove={(id) => setQty(id, 0)}
        onContinue={() => setModalOpen(true)}
        labels={{
          title: sel.tray.title,
          totalUnits: sel.tray.totalUnits,
          unitsUnit: sel.tray.unitsUnit,
          totalPrice: sel.tray.totalPrice,
          continueBtn: sel.tray.continueBtn,
        }}
      />

      <SellConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        items={trayItems}
        totalUnits={totalUnits}
        totalPrice={totalPrice}
        totalMoney={totalMoney}
        customers={customers}
        isOnline={isOnline}
        isSubmitting={isSubmitting}
        labels={{
          title: sel.modal.title,
          intro: sel.modal.intro,
          totalUnits: sel.tray.totalUnits,
          totalPrice: sel.tray.totalPrice,
          notesLabel: sel.modal.notesLabel,
          notesPlaceholder: sel.modal.notesPlaceholder,
          itemsToggle: sel.modal.itemsToggle,
          confirmBtn: sel.modal.confirmBtn,
          cancelBtn: sel.modal.cancelBtn,
          markFreeLabel: sel.modal.markFreeLabel,
          markFreeHint: sel.modal.markFreeHint,
          credit: t.debts.sell,
        }}
      />
    </div>
  );
}
