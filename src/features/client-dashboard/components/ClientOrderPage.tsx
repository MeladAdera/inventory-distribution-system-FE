'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ShoppingCart,
  Send,
  Pencil,
  Box,
} from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import { StockStatus } from '@/features/products/types/products.types';
import { CardShell } from '@/features/dashboard/components/CardShell';
import { CLIENT_INVENTORY, CATEGORIES } from '../mock/clientInventory';
import type { ClientInventoryItem, ClientCategory } from '../mock/clientInventory';

type Step = 1 | 2 | 3;

// ── Helpers ────────────────────────────────────────────────────────────────

function formatOrderDate(locale: 'ar' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

// ── Stepper ────────────────────────────────────────────────────────────────

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus size={14} />
      </button>
      <span className="font-mono text-[18px] font-semibold text-ink-900 w-10 text-center tabular-nums">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-ink-700 hover:bg-sand-100 transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({
  status,
  labels,
}: {
  status: StockStatus;
  labels: { enough: string; low: string; out: string };
}) {
  const map = {
    [StockStatus.HIGH_STOCK]: {
      bg: 'bg-success-100',
      text: 'text-success-700',
      dot: 'bg-success-700',
      label: labels.enough,
    },
    [StockStatus.LOW_STOCK]: {
      bg: 'bg-warning-100',
      text: 'text-warning-700',
      dot: 'bg-warning-700',
      label: labels.low,
    },
    [StockStatus.OUT_OF_STOCK]: {
      bg: 'bg-danger-100',
      text: 'text-danger-700',
      dot: 'bg-danger-700',
      label: labels.out,
    },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.75 rounded-full text-xs font-medium whitespace-nowrap',
        s.bg,
        s.text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      {s.label}
    </span>
  );
}

// ── Category Card ──────────────────────────────────────────────────────────

function CategoryCard({
  cat,
  productCount,
  cartCount,
  locale,
  addedLabel,
  productsLabel,
  onClick,
}: {
  cat: ClientCategory;
  productCount: number;
  cartCount: number;
  locale: 'ar' | 'en';
  addedLabel: string;
  productsLabel: string;
  onClick: () => void;
}) {
  const CatIcon = cat.icon;
  const name = locale === 'ar' ? cat.nameAr : cat.nameEn;

  return (
    <div
      onClick={onClick}
      className="bg-paper border border-border rounded-xl p-5 min-h-37.5 flex flex-col gap-4 cursor-pointer transition-all duration-180 hover:-translate-y-px hover:shadow-(--shadow-sm) hover:bg-sand-50 relative"
    >
      <div className="flex items-start justify-between">
        <div className="w-10.5 h-10.5 rounded-[10px] bg-sand-100 flex items-center justify-center shrink-0">
          <CatIcon size={20} className="text-ink-700" />
        </div>
        {cartCount > 0 && (
          <span className="bg-amber-100 text-amber-700 text-[12px] font-semibold px-2 py-0.75 rounded-full">
            {cartCount} {addedLabel}
          </span>
        )}
      </div>

      <div className="flex-1">
        <p className="text-[16px] font-semibold text-ink-900">{name}</p>
        <p className="text-[13px] text-ink-500 mt-0.5">
          {productCount} {productsLabel}
        </p>
      </div>
    </div>
  );
}

// ── Product Card ───────────────────────────────────────────────────────────

function ProductCard({
  item,
  qty,
  onQty,
  locale,
  labels,
}: {
  item: ClientInventoryItem;
  qty: number;
  onQty: (v: number) => void;
  locale: 'ar' | 'en';
  labels: {
    currentQty: string;
    requestedQty: string;
    addedToOrder: string;
    statusEnough: string;
    statusLow: string;
    statusOut: string;
  };
}) {
  const inCart = qty > 0;
  const name = locale === 'ar' ? item.nameAr : item.nameEn;
  const sku = `#${String(item.id).padStart(3, '0')}`;

  return (
    <div
      className={cn(
        'rounded-xl p-4.5 flex flex-col gap-3.5 min-h-[184px] transition-all duration-150',
        inCart ? 'border-2 border-amber-600 bg-amber-50' : 'border border-border bg-paper'
      )}
    >
      {/* Row 1: product info + badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <ProductThumb id={item.id} size={38} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-ink-900 truncate">{name}</p>
            <p className="font-mono text-[12px] text-ink-500">{sku}</p>
          </div>
        </div>
        {inCart && (
          <span className="shrink-0 bg-amber-100 text-amber-700 text-[12px] font-semibold px-2 py-0.75 rounded-full whitespace-nowrap">
            {labels.addedToOrder}
          </span>
        )}
      </div>

      {/* Row 2: current qty + status */}
      <div>
        <p className="text-[12px] text-ink-500 mb-1">{labels.currentQty}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-mono text-[16px] font-semibold text-ink-900 tabular-nums">
            {item.qty}
          </p>
          <StatusBadge
            status={item.status}
            labels={{
              enough: labels.statusEnough,
              low: labels.statusLow,
              out: labels.statusOut,
            }}
          />
        </div>
      </div>

      {/* Row 3: stepper */}
      <div>
        <p className="text-[12px] text-ink-500 mb-2">{labels.requestedQty}</p>
        <Stepper value={qty} onChange={onQty} />
      </div>
    </div>
  );
}

// ── Submit Modal ───────────────────────────────────────────────────────────

function SubmitModal({
  open,
  onClose,
  onConfirm,
  cart,
  notes,
  locale,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cart: Record<number, number>;
  notes: string;
  locale: 'ar' | 'en';
  labels: {
    title: string;
    intro: string;
    notesLabel: string;
    confirmBtn: string;
    cancelBtn: string;
  };
}) {
  const cartItems = CLIENT_INVENTORY.filter((p) => (cart[p.id] ?? 0) > 0);

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="md">
      <p className="text-[14px] text-ink-600 mb-4">{labels.intro}</p>

      <div className="flex flex-col max-h-52 overflow-y-auto mb-2">
        {cartItems.map((item) => {
          const name = locale === 'ar' ? item.nameAr : item.nameEn;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
            >
              <ProductThumb id={item.id} size={28} />
              <span className="flex-1 text-[14px] text-ink-800 truncate">{name}</span>
              <span className="font-mono text-[13px] font-semibold text-ink-900 shrink-0">
                {cart[item.id]}
              </span>
            </div>
          );
        })}
      </div>

      {notes && (
        <div className="mt-3 p-3 bg-sand-50 rounded-lg border border-border">
          <p className="text-[12px] font-medium text-ink-500 mb-1">{labels.notesLabel}</p>
          <p className="text-[13px] text-ink-700">{notes}</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
        >
          {labels.cancelBtn}
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-[14px] font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          <Send size={14} />
          {labels.confirmBtn}
        </button>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export function ClientOrderPage() {
  const { t, locale, dir } = useI18n();
  const router = useRouter();
  const { success: toastSuccess } = useToast();
  const isRtl = dir === 'rtl';

  const ord = t.client.order;

  const [step, setStep] = useState<Step>(1);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const BackChevron = isRtl ? ChevronRight : ChevronLeft;
  const totalCartItems = Object.values(cart).filter((v) => v > 0).length;
  const totalCartUnits = Object.values(cart).reduce((s, v) => s + v, 0);

  function handleSelectCat(catId: string) {
    setSelectedCat(catId);
    setQuery('');
    setStep(2);
  }

  function handleBackToCategories() {
    setSelectedCat(null);
    setQuery('');
    setStep(1);
  }

  function handleQty(productId: number, value: number) {
    setCart((prev) => {
      if (value === 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: value };
    });
  }

  function handleSubmitConfirm() {
    toastSuccess(ord.toast.success);
    setModalOpen(false);
    router.push('/client/orders');
  }

  // Derived
  const selectedCatData = CATEGORIES.find((c) => c.id === selectedCat) ?? null;
  const catProducts = selectedCat
    ? CLIENT_INVENTORY.filter((p) => p.categoryId === selectedCat)
    : [];

  const filteredCategories = CATEGORIES.filter((cat) => {
    if (!query) return true;
    const name = locale === 'ar' ? cat.nameAr : cat.nameEn;
    return name.toLowerCase().includes(query.toLowerCase());
  });

  const filteredProducts = catProducts.filter((p) => {
    if (!query) return true;
    const name = locale === 'ar' ? p.nameAr : p.nameEn;
    return name.toLowerCase().includes(query.toLowerCase());
  });

  const dateStr = formatOrderDate(locale);

  const productCardLabels = {
    currentQty: ord.productCard.currentQty,
    requestedQty: ord.productCard.requestedQty,
    addedToOrder: ord.productCard.addedToOrder,
    statusEnough: ord.productCard.statusEnough,
    statusLow: ord.productCard.statusLow,
    statusOut: ord.productCard.statusOut,
  };

  return (
    <div className="max-w-330 mx-auto">
      {/* ── Page Header ── */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink-900">{ord.title}</h1>
        <p className="text-[14px] text-ink-500 mt-1">
          {ord.datePrefix} {dateStr}
        </p>
      </div>

      {/* ══════════════════════════════════════════════
          STEP 1 — Category Selection
      ══════════════════════════════════════════════ */}
      {step === 1 && (
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-ink-500 mb-4">
            {ord.stepLabel}
          </p>

          {/* Search + cart badge */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 flex items-center h-10 bg-paper border border-border rounded-lg px-3 gap-2">
              <Search size={15} className="text-ink-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ord.search}
                className="flex-1 text-[13px] text-ink-900 placeholder:text-ink-400 bg-transparent outline-none"
              />
            </div>

            <button
              onClick={() => totalCartItems > 0 && setStep(3)}
              disabled={totalCartItems === 0}
              className={cn(
                'flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-paper text-[14px] font-semibold text-ink-800 shrink-0 transition-opacity',
                totalCartItems === 0 ? 'opacity-55 cursor-not-allowed' : 'hover:bg-sand-50'
              )}
            >
              <ShoppingCart size={16} className="text-ink-700" />
              {totalCartItems} {ord.cartBadge}
            </button>
          </div>

          {/* Category grid */}
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <Box size={32} className="text-ink-300" />
              <p className="text-[14px] text-ink-500">{ord.empty.noCategories}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => {
                const productCount = CLIENT_INVENTORY.filter((p) => p.categoryId === cat.id).length;
                const cartCount = CLIENT_INVENTORY.filter(
                  (p) => p.categoryId === cat.id && (cart[p.id] ?? 0) > 0
                ).length;
                return (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    productCount={productCount}
                    cartCount={cartCount}
                    locale={locale}
                    addedLabel={ord.addedBadge}
                    productsLabel={ord.products}
                    onClick={() => handleSelectCat(cat.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STEP 2 — Product List
      ══════════════════════════════════════════════ */}
      {step === 2 && selectedCatData && (
        <div className="pb-24">
          {/* Header row */}
          <div className="flex items-start gap-4 mb-5">
            <button
              onClick={handleBackToCategories}
              className="flex items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-amber-700 transition-colors mt-0.5"
            >
              <BackChevron size={16} className="shrink-0" />
              {ord.backToCategories}
            </button>
            <div>
              <h2 className="text-[18px] font-semibold text-ink-900">
                {locale === 'ar' ? selectedCatData.nameAr : selectedCatData.nameEn}
              </h2>
              <p className="text-[13px] text-ink-500 mt-0.5">
                {catProducts.length} {ord.products}
                {totalCartItems > 0 && (
                  <>
                    {' '}
                    · {totalCartItems} {ord.bottomBar.itemsAdded}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center h-10 bg-paper border border-border rounded-lg px-3 gap-2 mb-5">
            <Search size={15} className="text-ink-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ord.search}
              className="flex-1 text-[13px] text-ink-900 placeholder:text-ink-400 bg-transparent outline-none"
            />
          </div>

          {/* Product grid */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center bg-paper border border-border rounded-xl">
              <Box size={28} className="text-ink-300" />
              <p className="text-[14px] text-ink-500">{ord.empty.noProducts}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  qty={cart[item.id] ?? 0}
                  onQty={(v) => handleQty(item.id, v)}
                  locale={locale}
                  labels={productCardLabels}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STEP 3 — Review & Submit
      ══════════════════════════════════════════════ */}
      {step === 3 && (
        <div>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => (selectedCat ? setStep(2) : handleBackToCategories())}
              className="flex items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-amber-700 transition-colors"
            >
              <BackChevron size={16} className="shrink-0" />
              {ord.review.backBtn}
            </button>
            <h2 className="text-[18px] font-semibold text-ink-900">{ord.review.title}</h2>
          </div>

          {/* 2-col layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: order items */}
            <CardShell title={ord.review.productsTitle}>
              <div className="-mx-5 -mb-5">
                {CLIENT_INVENTORY.filter((p) => (cart[p.id] ?? 0) > 0).map((item) => {
                  const name = locale === 'ar' ? item.nameAr : item.nameEn;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0"
                    >
                      <ProductThumb id={item.id} size={38} />
                      <span className="flex-1 text-[14px] text-ink-800 truncate">{name}</span>
                      <span className="font-mono text-[14px] font-semibold text-ink-900 shrink-0 me-1">
                        {cart[item.id]}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedCat(item.categoryId);
                          setStep(2);
                        }}
                        className="p-1.5 rounded-lg text-ink-400 hover:text-amber-700 hover:bg-amber-50 transition-colors shrink-0"
                        title={ord.review.backBtn}
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  );
                })}

                {/* Add another product */}
                <div className="px-5 py-4">
                  <button
                    onClick={handleBackToCategories}
                    className="w-full flex items-center justify-center gap-2 py-3.25 border border-dashed border-border rounded-xl text-[14px] text-ink-500 hover:border-amber-600 hover:text-amber-700 transition-colors"
                  >
                    <Plus size={14} />
                    {ord.review.addLineBtn}
                  </button>
                </div>
              </div>
            </CardShell>

            {/* Right: summary + notes + submit */}
            <CardShell title={ord.review.summaryTitle}>
              <div className="flex flex-col gap-5">
                {/* Summary rows */}
                <div>
                  <div className="flex items-center justify-between py-2.5 border-b border-border">
                    <span className="text-[13px] text-ink-500">{ord.review.totalItems}</span>
                    <span className="font-mono text-[14px] font-semibold text-ink-900">
                      {totalCartItems} {ord.review.itemsUnit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[13px] text-ink-500">{ord.review.totalUnits}</span>
                    <span className="font-mono text-[14px] font-semibold text-ink-900">
                      {totalCartUnits} {ord.review.unitsUnit}
                    </span>
                  </div>
                </div>

                {/* Notes textarea */}
                <div>
                  <label className="text-[13px] font-medium text-ink-700 mb-1.5 block">
                    {ord.review.notesLabel}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={ord.review.notesPlaceholder}
                    rows={4}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-[13px] text-ink-900 placeholder:text-ink-400 bg-paper resize-none outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Submit button */}
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors"
                >
                  <Send size={16} />
                  {ord.review.submitBtn}
                </button>
              </div>
            </CardShell>
          </div>
        </div>
      )}

      {/* ── Step 2 sticky bottom bar ── */}
      {step === 2 && totalCartItems > 0 && (
        <div className="fixed bottom-14 sm:bottom-0 inset-x-0 z-30 flex items-center justify-between px-6 py-4 bg-paper border-t border-border">
          <span className="text-[14px] font-medium text-ink-700">
            {totalCartItems} {ord.bottomBar.itemsAdded}
          </span>
          <button
            onClick={() => setStep(3)}
            className="flex items-center gap-2 px-5 h-10 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors"
          >
            {ord.bottomBar.reviewBtn}
          </button>
        </div>
      )}

      {/* ── Submit confirmation modal ── */}
      <SubmitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSubmitConfirm}
        cart={cart}
        notes={notes}
        locale={locale}
        labels={{
          title: ord.modal.title,
          intro: ord.modal.intro,
          notesLabel: ord.modal.notesLabel,
          confirmBtn: ord.modal.confirmBtn,
          cancelBtn: ord.modal.cancelBtn,
        }}
      />
    </div>
  );
}
