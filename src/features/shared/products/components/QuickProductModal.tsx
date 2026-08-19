'use client';

import { useEffect, useState } from 'react';
import { Loader2, Info } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { useI18n } from '@/providers/I18nProvider';
import { getErrorMessage } from '@/common/utils/error.utils';
import { formatMoney, isValidMoneyInput, parseMoney } from '@/common/utils/money';
import { useAuthStore } from '@/features/auth/store/authStore';
import { tokenUtils } from '@/features/auth/utils/token.utils';
import { useCategories } from '@/features/shared/categories/hooks/useCategories';
import { useProducts } from '../hooks/useProducts';

/** Mirrors `createProductSchema` — the server rejects anything shorter. */
const NAME_MIN_LENGTH = 3;

interface QuickProductModalProps {
  open: boolean;
  onClose: () => void;
  /** Prefills the name from whatever was searched for and not found. */
  initialName?: string;
  /**
   * The new product, plus what it cost to buy — so the caller can drop it
   * straight onto a line with the price already filled in.
   */
  onCreated: (product: { id: number; name: string }, unitCost: string) => void;
}

/**
 * Create a product without leaving the bill you're recording.
 *
 * A bill line takes a `productId`, so a delivery containing something the
 * catalog has never seen would otherwise be a dead end — leave the form, go to
 * Products, create it, come back, start again.
 *
 * Deliberately not `ProductFormModal`. That form carries an image uploader, a
 * description, an orderable toggle and an opening-quantity field: noise while a
 * delivery is standing in the doorway, and the quantity field is actively
 * wrong here — the bill line is about to stock the product, so an opening
 * balance would count the same delivery twice.
 *
 * Asking the buying price does double duty. It sets `cost_price` so the catalog
 * starts out honest, and it prefills the line's unit cost, so the number is
 * typed once rather than twice.
 *
 * The product is created immediately on save rather than held until the bill is
 * posted. If the bill is then rejected the product stays behind — but it is a
 * real product the shop genuinely stocks, listed with no stock, and deferring
 * would not avoid this: a create-then-post chain fails in exactly the same
 * place, only with ids the user can no longer see.
 */
export function QuickProductModal({
  open,
  onClose,
  initialName = '',
  onCreated,
}: QuickProductModalProps) {
  const { t } = useI18n();
  const q = t.products.quickCreate;
  const currency = t.debts.currency;

  const { user } = useAuthStore();
  const shopId = user?.shopId ?? tokenUtils.getShopId();
  const { categories } = useCategories(shopId ? { shopId } : undefined);
  const { createProduct, isCreating } = useProducts();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setCategoryId('');
    setBuyPrice('');
    setSellPrice('');
    setBarcode('');
    setServerError(null);
  }, [open, initialName]);

  const buy = buyPrice.trim();
  const sell = sellPrice.trim();

  const nameError =
    name.trim() !== '' && name.trim().length < NAME_MIN_LENGTH ? q.errNameShort : null;
  // Both prices must be > 0: the selling price because the server requires it,
  // the buying price because it becomes the line's unit cost, and a bill can't
  // carry a zero-cost line — nothing would be owed for it.
  const buyError = buy === '' || isValidMoneyInput(buy) ? null : q.errInvalid;
  const sellError = sell === '' || isValidMoneyInput(sell) ? null : q.errInvalid;

  // Shown as it is typed, not after saving: a buying price above the selling
  // price is a decision to make now, while both numbers are still in hand.
  const margin =
    buyError === null && sellError === null && buy !== '' && sell !== ''
      ? (() => {
          const buyMinor = parseMoney(buy);
          const sellMinor = parseMoney(sell);
          const profitMinor = sellMinor - buyMinor;
          return {
            profit: formatMoney(profitMinor / 100),
            pct: sellMinor > 0 ? (profitMinor / sellMinor) * 100 : 0,
            negative: profitMinor <= 0,
          };
        })()
      : null;

  const canSubmit =
    name.trim().length >= NAME_MIN_LENGTH &&
    categoryId !== '' &&
    isValidMoneyInput(buy) &&
    isValidMoneyInput(sell) &&
    !isCreating;

  async function handleSubmit() {
    if (!canSubmit) return;
    setServerError(null);
    try {
      const result = await createProduct({
        data: {
          name: name.trim(),
          category_id: categoryId as number,
          price: Number(sell),
          cost_price: Number(buy),
          ...(barcode.trim() ? { barcode: barcode.trim() } : {}),
        },
        shop_id: shopId,
      });
      const created = result.data as { id: number; name: string };
      onCreated({ id: created.id, name: created.name ?? name.trim() }, buy);
      onClose();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={q.title} size="md">
      <p className="mb-4 text-[14px] text-ink-600">{q.intro}</p>

      {serverError && (
        <p className="mb-3 rounded-lg bg-danger-100 px-3 py-2 text-[13px] text-danger-700">
          {serverError}
        </p>
      )}

      <label className="mb-1.5 block text-[12px] font-medium text-ink-500">{q.name}</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        placeholder={q.namePlaceholder}
        className={`w-full rounded-lg border bg-page px-3 py-2 text-[15px] text-ink-900 outline-none placeholder:text-ink-400 ${
          nameError ? 'border-danger-700' : 'border-border focus:border-amber-500'
        }`}
      />
      {nameError && <p className="mt-1 text-[12px] text-danger-700">{nameError}</p>}

      <label className="mb-1.5 mt-4 block text-[12px] font-medium text-ink-500">{q.category}</label>
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full cursor-pointer rounded-lg border border-border bg-page px-3 py-2 text-[14px] text-ink-900 outline-none focus:border-amber-500"
      >
        <option value="">{q.categoryPlaceholder}</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-ink-500">{q.buyPrice}</label>
          <input
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            inputMode="decimal"
            dir="ltr"
            placeholder="0.00"
            className={`w-full rounded-lg border bg-page px-3 py-2 font-mono text-[15px] tabular-nums text-ink-900 outline-none placeholder:text-ink-400 ${
              buyError ? 'border-danger-700' : 'border-border focus:border-amber-500'
            }`}
          />
          {buyError ? (
            <p className="mt-1 text-[12px] text-danger-700">{buyError}</p>
          ) : (
            <p className="mt-1 text-[12px] text-ink-400">{q.buyPriceHint}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-ink-500">{q.sellPrice}</label>
          <input
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            inputMode="decimal"
            dir="ltr"
            placeholder="0.00"
            className={`w-full rounded-lg border bg-page px-3 py-2 font-mono text-[15px] tabular-nums text-ink-900 outline-none placeholder:text-ink-400 ${
              sellError ? 'border-danger-700' : 'border-border focus:border-amber-500'
            }`}
          />
          {sellError ? (
            <p className="mt-1 text-[12px] text-danger-700">{sellError}</p>
          ) : (
            <p className="mt-1 text-[12px] text-ink-400">{q.sellPriceHint}</p>
          )}
        </div>
      </div>

      {margin && (
        <div
          className={`mt-3 flex items-baseline justify-between gap-3 rounded-lg border px-3.5 py-2.5 ${
            margin.negative ? 'border-danger-700 bg-danger-100' : 'border-border bg-page'
          }`}
        >
          <span className="text-[13px] text-ink-600">
            {margin.negative ? q.marginNegative : q.marginLabel}
          </span>
          <span
            className={`font-mono text-[15px] font-bold tabular-nums ${
              margin.negative ? 'text-danger-700' : 'text-success-700'
            }`}
          >
            {margin.profit}{' '}
            <span className="font-sans text-[12px] font-normal text-ink-400">
              {currency} ({margin.pct.toFixed(0)}%)
            </span>
          </span>
        </div>
      )}

      <label className="mb-1.5 mt-4 block text-[12px] font-medium text-ink-500">{q.barcode}</label>
      <input
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        dir="ltr"
        placeholder={q.barcodePlaceholder}
        className="w-full rounded-lg border border-border bg-page px-3 py-2 font-mono text-[14px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-amber-500"
      />

      <p className="mt-3 flex items-start gap-1.5 text-[12px] text-ink-400">
        <Info size={13} className="mt-0.5 shrink-0" />
        {q.stockHint}
      </p>

      <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
        <button
          onClick={onClose}
          disabled={isCreating}
          className="rounded-lg border border-border px-4 py-2 text-[14px] font-medium text-ink-700 transition-colors hover:bg-sand-100 disabled:opacity-60"
        >
          {q.cancel}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating && <Loader2 size={14} className="animate-spin" />}
          {q.submit}
        </button>
      </div>
    </Modal>
  );
}
