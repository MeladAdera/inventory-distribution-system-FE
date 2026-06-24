'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Box,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { getErrorMessage } from '@/common/utils/error.utils';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { TypewriterText } from '@/common/components/TypewriterText';
import { useClientOrderProducts } from '../hooks/useClientOrderProducts';
import { OrderCategoryCard } from './order/OrderCategoryCard';
import { OrderProductCard } from './order/OrderProductCard';
import { OrderReviewPanel } from './order/OrderReviewPanel';
import { OrderSummaryPanel } from './order/OrderSummaryPanel';
import { OrderSubmitModal } from './order/OrderSubmitModal';

export function ClientOrderPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const isRtl = dir === 'rtl';
  const ord = t.client.order;

  const [step, setStep] = useState(1);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { categories, isLoading, error, createOrder, isSubmitting } = useClientOrderProducts();

  // ── Derived ────────────────────────────────────────────────────────────────
  const allProducts = categories.flatMap((c) => c.products);
  const selectedCategory = categories.find((c) => c.id === selectedCatId) ?? null;

  const cartItems = allProducts.filter((p) => (cart[p.id] ?? 0) > 0);
  const totalCartItems = cartItems.length;
  const totalCartUnits = cartItems.reduce((sum, p) => sum + (cart[p.id] ?? 0), 0);

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
    setStep(2);
  }

  function handleBackToCategories() {
    setSelectedCatId(null);
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

  async function handleSubmitConfirm() {
    try {
      await createOrder({
        items: cartItems.map((p) => ({ productId: p.id, quantity: cart[p.id] })),
      });
      toastSuccess(ord.toast.success);
      setModalOpen(false);
      router.push('/client/orders');
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  }

  const BackChevron = isRtl ? ChevronRight : ChevronLeft;
  const productCardLabels = {
    currentQty: ord.productCard.currentQty,
    requestedQty: ord.productCard.requestedQty,
    addedToOrder: ord.productCard.addedToOrder,
    statusEnough: ord.productCard.statusEnough,
    statusLow: ord.productCard.statusLow,
    statusOut: ord.productCard.statusOut,
  };

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]">{ord.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={28} className="text-danger-500" />
        <p className="text-[14px] text-ink-600">{ord.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink-900">
          <TypewriterText phrases={ord.taglines} />
        </h1>
      </div>

      {/* ══ STEP 1 — Category grid ══ */}
      {step === 1 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
              />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ord.search}
                className="ps-8"
              />
            </div>
            <div className="relative shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => totalCartItems > 0 && setStep(3)}
                disabled={totalCartItems === 0}
                className="h-10 w-10 rounded-xl"
              >
                <ShoppingCart size={18} />
              </Button>
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -inset-e-1.5 min-w-4.5 h-4.5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center px-1 tabular-nums pointer-events-none">
                  {totalCartItems}
                </span>
              )}
            </div>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <Box size={32} className="text-ink-300" />
              <p className="text-[14px] text-ink-500">{ord.empty.noCategories}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <OrderCategoryCard
                  key={cat.id}
                  category={cat}
                  cartCount={cat.products.filter((p) => (cart[p.id] ?? 0) > 0).length}
                  onClick={() => handleSelectCat(cat.id)}
                  labels={{ addedBadge: ord.addedBadge, products: ord.products }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ STEP 2 — Product list ══ */}
      {step === 2 && selectedCategory && (
        <div className="pb-24">
          <div className="mb-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCategories}
              className="gap-1 mb-2 -ms-1"
            >
              <BackChevron size={15} className="shrink-0" />
              {ord.backToCategories}
            </Button>
            <h2 className="text-[20px] font-semibold text-ink-900">{selectedCategory.name}</h2>
            <p className="text-[13px] text-ink-400 mt-0.5">
              {selectedCategory.products.length} {ord.products}
              {totalCartItems > 0 && (
                <span className="text-amber-600 font-medium">
                  {' '}
                  · {totalCartItems} {ord.bottomBar.itemsAdded}
                </span>
              )}
            </p>
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
              placeholder={ord.search}
              className="ps-8"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3 text-center bg-paper border border-border rounded-xl">
              <Box size={28} className="text-ink-300" />
              <p className="text-[14px] text-ink-500">{ord.empty.noProducts}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <OrderProductCard
                  key={product.id}
                  product={product}
                  qty={cart[product.id] ?? 0}
                  onQty={(v) => handleQty(product.id, v)}
                  labels={productCardLabels}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ STEP 3 — Review & submit ══ */}
      {step === 3 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (selectedCatId !== null ? setStep(2) : handleBackToCategories())}
              className="gap-1"
            >
              <BackChevron size={16} className="shrink-0" />
              {ord.review.backBtn}
            </Button>
            <h2 className="text-[18px] font-semibold text-ink-900">{ord.review.title}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrderReviewPanel
              cartItems={cartItems}
              cart={cart}
              onEditProduct={(categoryId) => {
                setSelectedCatId(categoryId);
                setStep(2);
              }}
              onAddMore={handleBackToCategories}
              labels={{
                productsTitle: ord.review.productsTitle,
                backBtn: ord.review.backBtn,
                addLineBtn: ord.review.addLineBtn,
              }}
            />
            <OrderSummaryPanel
              totalItems={totalCartItems}
              totalUnits={totalCartUnits}
              isSubmitting={isSubmitting}
              onSubmit={() => setModalOpen(true)}
              labels={{
                summaryTitle: ord.review.summaryTitle,
                totalItems: ord.review.totalItems,
                totalUnits: ord.review.totalUnits,
                itemsUnit: ord.review.itemsUnit,
                unitsUnit: ord.review.unitsUnit,
                submitBtn: ord.review.submitBtn,
              }}
            />
          </div>
        </div>
      )}

      {/* Step 2 sticky bottom bar */}
      {step === 2 && totalCartItems > 0 && (
        <div className="fixed bottom-14 sm:bottom-0 inset-x-0 z-30 flex items-center justify-between px-6 py-4 bg-paper border-t border-border">
          <span className="text-[14px] font-medium text-ink-700">
            {totalCartItems} {ord.bottomBar.itemsAdded}
          </span>
          <Button onClick={() => setStep(3)} className="px-5">
            {ord.bottomBar.reviewBtn}
          </Button>
        </div>
      )}

      <OrderSubmitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSubmitConfirm}
        cartItems={cartItems}
        cart={cart}
        isSubmitting={isSubmitting}
        labels={{
          title: ord.modal.title,
          intro: ord.modal.intro,
          confirmBtn: ord.modal.confirmBtn,
          cancelBtn: ord.modal.cancelBtn,
        }}
      />
    </div>
  );
}
