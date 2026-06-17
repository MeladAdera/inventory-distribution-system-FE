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
  Package,
  Box,
} from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import { StockStatus } from '@/features/products/types/products.types';
import { CLIENT_INVENTORY, CATEGORIES } from '../mock/clientInventory';
import type { ClientInventoryItem, ClientCategory } from '../mock/clientInventory';

// ── Helpers ────────────────────────────────────────────────────────────────

function calcStatus(qty: number, min: number): StockStatus {
  if (qty === 0) return StockStatus.OUT_OF_STOCK;
  if (qty < min) return StockStatus.LOW_STOCK;
  return StockStatus.HIGH_STOCK;
}

// ── Stepper ────────────────────────────────────────────────────────────────

function Stepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
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
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ── Inventory status badge ─────────────────────────────────────────────────

function InvStatusBadge({
  status,
  enough,
  low,
  out,
}: {
  status: StockStatus;
  enough: string;
  low: string;
  out: string;
}) {
  const map = {
    [StockStatus.HIGH_STOCK]: {
      bg: 'bg-success-100',
      text: 'text-success-700',
      dot: 'bg-success-700',
      label: enough,
    },
    [StockStatus.LOW_STOCK]: {
      bg: 'bg-warning-100',
      text: 'text-warning-700',
      dot: 'bg-warning-700',
      label: low,
    },
    [StockStatus.OUT_OF_STOCK]: {
      bg: 'bg-danger-100',
      text: 'text-danger-700',
      dot: 'bg-danger-700',
      label: out,
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
  products,
  hasEdits,
  locale,
  labels,
  onClick,
}: {
  cat: ClientCategory;
  products: ClientInventoryItem[];
  hasEdits: boolean;
  locale: 'ar' | 'en';
  labels: { edited: string; variants: string; totalQty: string };
  onClick: () => void;
}) {
  const CatIcon = cat.icon;
  const name = locale === 'ar' ? cat.nameAr : cat.nameEn;
  const totalQty = products.reduce((sum, p) => sum + p.qty, 0);

  return (
    <div
      onClick={onClick}
      className="bg-paper border border-border rounded-xl p-5 min-h-37.5 flex flex-col gap-4 cursor-pointer transition-all duration-180 hover:-translate-y-px hover:shadow-(--shadow-sm) hover:bg-sand-50"
    >
      <div className="flex items-start justify-between">
        <div className="w-10.5 h-10.5 rounded-[10px] bg-sand-100 flex items-center justify-center shrink-0">
          <CatIcon size={20} className="text-ink-700" />
        </div>
        {hasEdits && (
          <span className="text-[13px] font-medium text-amber-700">{labels.edited}</span>
        )}
      </div>

      <div className="flex-1">
        <p className="text-[16px] font-semibold text-ink-900">{name}</p>
        <p className="text-[13px] text-ink-500 mt-0.5">
          {products.length} {labels.variants}
        </p>
      </div>

      <p className="text-[12px] text-ink-400">
        {labels.totalQty}: {totalQty}
      </p>
    </div>
  );
}

// ── Product Card ───────────────────────────────────────────────────────────

function ProductCard({
  item,
  delta,
  onDelta,
  locale,
  labels,
  onOrderMore,
}: {
  item: ClientInventoryItem;
  delta: number;
  onDelta: (v: number) => void;
  locale: 'ar' | 'en';
  labels: {
    currentQty: string;
    updateQty: string;
    fromBackStock: string;
    noBackStock: string;
    orderMore: string;
    statusEnough: string;
    statusLow: string;
    statusOut: string;
  };
  onOrderMore: () => void;
}) {
  const name = locale === 'ar' ? item.nameAr : item.nameEn;
  const sku = `#${String(item.id).padStart(3, '0')}`;
  const hasBackStock = item.backStock > 0;

  return (
    <div className="bg-paper border border-border rounded-xl p-4.5 flex flex-col gap-3.5">
      {/* Row 1: product info */}
      <div className="flex items-center gap-3">
        <ProductThumb id={item.id} size={38} />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-ink-900 truncate">{name}</p>
          <p className="font-mono text-[12px] text-ink-500">{sku}</p>
        </div>
      </div>

      {/* Row 2: status + back-stock */}
      <div className="flex items-center gap-2 flex-wrap">
        <InvStatusBadge
          status={item.status}
          enough={labels.statusEnough}
          low={labels.statusLow}
          out={labels.statusOut}
        />
        {hasBackStock ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.75 rounded-full text-xs font-medium bg-success-100 text-success-700 whitespace-nowrap">
            {item.backStock} {labels.fromBackStock}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.75 rounded-full text-xs font-medium bg-sand-100 text-ink-500 whitespace-nowrap">
            {labels.noBackStock}
          </span>
        )}
      </div>

      {/* Row 3: current qty */}
      <div>
        <p className="text-[12px] text-ink-500 mb-1">{labels.currentQty}</p>
        <p className="font-mono text-[24px] font-bold text-ink-900 tabular-nums leading-none">
          {item.qty}
        </p>
      </div>

      {/* Row 4/5: stepper or order-more */}
      {hasBackStock ? (
        <div>
          <p className="text-[12px] text-ink-500 mb-2">{labels.updateQty}</p>
          <Stepper value={delta} onChange={onDelta} max={item.backStock} />
        </div>
      ) : (
        <button
          onClick={onOrderMore}
          className="self-start flex items-center gap-1.5 px-3 py-1.75 rounded-lg border border-amber-600 bg-amber-50 text-amber-700 text-[13px] font-semibold hover:bg-amber-100 transition-colors"
        >
          <ShoppingCart size={13} />
          {labels.orderMore}
        </button>
      )}
    </div>
  );
}

// ── Save Modal ─────────────────────────────────────────────────────────────

function SaveModal({
  open,
  onClose,
  onConfirm,
  inventory,
  changes,
  locale,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  inventory: ClientInventoryItem[];
  changes: Record<number, number>;
  locale: 'ar' | 'en';
  labels: { title: string; intro: string; noChanges: string; confirm: string; cancel: string };
}) {
  const changedItems = inventory.filter((p) => (changes[p.id] ?? 0) > 0);

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="md">
      <p className="text-[14px] text-ink-600 mb-4">{labels.intro}</p>

      {changedItems.length === 0 ? (
        <p className="text-[14px] text-ink-400 py-2">{labels.noChanges}</p>
      ) : (
        <div className="flex flex-col gap-3 mb-2 max-h-56 overflow-y-auto">
          {changedItems.map((item) => {
            const name = locale === 'ar' ? item.nameAr : item.nameEn;
            const delta = changes[item.id];
            return (
              <div key={item.id} className="flex items-center gap-3">
                <ProductThumb id={item.id} size={28} />
                <span className="flex-1 text-[14px] text-ink-800 truncate">{name}</span>
                <span className="font-mono text-[13px] font-medium text-ink-900 shrink-0">
                  {item.qty} → {item.qty + delta}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
        >
          {labels.cancel}
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-lg bg-ink-900 text-[14px] font-medium text-amber-500 hover:bg-ink-800 transition-colors"
        >
          {labels.confirm}
        </button>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export function ClientInventoryPage() {
  const { t, locale, dir } = useI18n();
  const router = useRouter();
  const { success: toastSuccess } = useToast();
  const isRtl = dir === 'rtl';

  const inv = t.client.inventory;

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<number, number>>({});
  const [inventory, setInventory] = useState<ClientInventoryItem[]>([...CLIENT_INVENTORY]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const hasChanges = Object.values(changes).some((v) => v > 0);

  function handleSelectCat(catId: string) {
    setSelectedCat(catId);
    setQuery('');
    setFilter('all');
  }

  function handleBack() {
    setSelectedCat(null);
    setQuery('');
  }

  function handleDelta(productId: number, value: number) {
    setChanges((prev) => {
      if (value === 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: value };
    });
  }

  function handleSave() {
    setInventory((prev) =>
      prev.map((item) => {
        const delta = changes[item.id] ?? 0;
        if (delta === 0) return item;
        const newQty = item.qty + delta;
        const newBackStock = Math.max(0, item.backStock - delta);
        return {
          ...item,
          qty: newQty,
          backStock: newBackStock,
          status: calcStatus(newQty, item.min),
        };
      })
    );
    setChanges({});
    setModalOpen(false);
    toastSuccess(inv.toast.success);
  }

  // Derived data
  const selectedCatData = CATEGORIES.find((c) => c.id === selectedCat) ?? null;
  const catProducts = selectedCat ? inventory.filter((p) => p.categoryId === selectedCat) : [];

  const filteredCategories = CATEGORIES.filter((cat) => {
    if (!query) return true;
    const name = locale === 'ar' ? cat.nameAr : cat.nameEn;
    return name.toLowerCase().includes(query.toLowerCase());
  });

  const filteredProducts = catProducts
    .filter((p) => {
      if (filter === 'low') return p.status === StockStatus.LOW_STOCK;
      if (filter === 'out') return p.status === StockStatus.OUT_OF_STOCK;
      return true;
    })
    .filter((p) => {
      if (!query) return true;
      const name = locale === 'ar' ? p.nameAr : p.nameEn;
      return name.toLowerCase().includes(query.toLowerCase());
    });

  const BackChevron = isRtl ? ChevronRight : ChevronLeft;

  const productLabels = {
    currentQty: inv.currentQty,
    updateQty: inv.updateQty,
    fromBackStock: inv.fromBackStock,
    noBackStock: inv.noBackStock,
    orderMore: inv.orderMore,
    statusEnough: inv.statusEnough,
    statusLow: inv.statusLow,
    statusOut: inv.statusOut,
  };

  const FILTER_TABS: { key: 'all' | 'low' | 'out'; label: string }[] = [
    { key: 'all', label: inv.filters.all },
    { key: 'low', label: inv.filters.low },
    { key: 'out', label: inv.filters.out },
  ];

  return (
    <div className="max-w-330 mx-auto">
      {/* ── Header ── */}
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

      {/* ── Search bar ── */}
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

      {/* ── View A: Category grid ── */}
      {!selectedCat &&
        (inventory.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <Package size={32} className="text-ink-300" />
            <p className="text-[14px] text-ink-500">{inv.empty.noProducts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => {
              const products = inventory.filter((p) => p.categoryId === cat.id);
              const hasEdits = products.some((p) => (changes[p.id] ?? 0) > 0);
              return (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  products={products}
                  hasEdits={hasEdits}
                  locale={locale}
                  labels={{ edited: inv.edited, variants: inv.variants, totalQty: inv.totalQty }}
                  onClick={() => handleSelectCat(cat.id)}
                />
              );
            })}
          </div>
        ))}

      {/* ── View B: Product cards ── */}
      {selectedCat && selectedCatData && (
        <div>
          {/* Breadcrumb */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-amber-700 transition-colors mb-5"
          >
            <BackChevron size={16} className="text-ink-400 shrink-0" />
            {locale === 'ar' ? selectedCatData.nameAr : selectedCatData.nameEn}
          </button>

          {/* Category header */}
          <div className="mb-5">
            <h2 className="text-[22px] font-semibold text-ink-900">
              {locale === 'ar' ? selectedCatData.nameAr : selectedCatData.nameEn}
            </h2>
            <p className="text-[13px] text-ink-500 mt-0.5">
              {catProducts.length} {inv.availableProducts}
            </p>
          </div>

          {/* Filter tabs */}
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

          {/* Product grid or empty */}
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
                  locale={locale}
                  labels={productLabels}
                  onOrderMore={() => router.push(`/client/order?product=${item.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Mobile sticky save bar (above bottom nav) ── */}
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

      {/* ── Save modal ── */}
      <SaveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSave}
        inventory={inventory}
        changes={changes}
        locale={locale}
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
