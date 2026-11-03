import { useCallback, useEffect, useState } from 'react';
import { Loader2, WifiOff } from 'lucide-react';
import { Drawer } from '@/common/components/Drawer';
import { cn } from '@/common/utils/cn';
import {
  formatMoney,
  isValidMoneyInput,
  normalizeDecimalInput,
  parseMoney,
} from '@/common/utils/money';
import { updateLowStockThresholdSchema } from '@/features/shared/inventory/validations/inventory.schema';
import { ProductBanner } from '@/features/shared/products/components/ProductBanner';
import { InvStatusBadge } from './InvStatusBadge';
import type {
  EnrichedInventoryItem,
  InventoryItemSettingsChanges,
} from '../../types/clientInventory.types';

export interface ProductDetailsLabels {
  currentQty: string;
  statusEnough: string;
  statusLow: string;
  statusOut: string;
  category: string;
  barcode: string;
  description: string;
  source: string;
  sourceWarehouse: string;
  sourceOwn: string;
  shopSettings: string;
  shopSettingsHint: string;
  readOnly: string;
  salePrice: string;
  catalogDefault: string;
  avgCost: string;
  profitPerUnit: string;
  margin: string;
  errPrice: string;
  minQty: string;
  minQtyHint: string;
  errMinQty: string;
  offline: string;
  save: string;
  cancel: string;
}

interface ProductDetailsDrawerProps {
  item: EnrichedInventoryItem | null;
  onClose: () => void;
  /** Lucide icon name from the item's category; shown when there's no photo. */
  categoryIcon?: string | null;
  /** The shop's own product, as opposed to one taken from the warehouse catalog. */
  isOwnProduct: boolean;
  /** Shop owner only — the price and threshold endpoints are 403 for employees. */
  canEdit: boolean;
  isOnline: boolean;
  isSaving: boolean;
  onSave: (changes: InventoryItemSettingsChanges) => Promise<void>;
  labels: ProductDetailsLabels;
}

export function ProductDetailsDrawer({
  item,
  onClose,
  categoryIcon,
  isOwnProduct,
  canEdit,
  isOnline,
  isSaving,
  onSave,
  labels,
}: ProductDetailsDrawerProps) {
  const [price, setPrice] = useState('');
  const [threshold, setThreshold] = useState('');

  // Inputs start empty with the current value as the placeholder, like the old
  // price modal. Reset on the id, not the object: the row is refetched after a
  // save, and a partial failure must keep what was typed for the half that failed.
  const itemId = item?.id;
  useEffect(() => {
    setPrice('');
    setThreshold('');
  }, [itemId]);

  // Stable on purpose: Drawer re-runs its focus effect whenever onClose
  // changes, so a new function per keystroke would pull focus out of the input.
  const handleClose = useCallback(() => {
    if (!isSaving) onClose();
  }, [isSaving, onClose]);

  if (!item) return null;

  const priceTyped = price !== '';
  const priceValid = !priceTyped || isValidMoneyInput(price);
  const priceChanged =
    priceTyped && priceValid && parseMoney(price) !== parseMoney(item.sale_price);

  const thresholdTyped = threshold !== '';
  const thresholdNum = Number(threshold);
  const thresholdValid =
    !thresholdTyped ||
    updateLowStockThresholdSchema.safeParse({ lowStockThreshold: thresholdNum }).success;
  const thresholdChanged =
    thresholdTyped && thresholdValid && thresholdNum !== item.low_stock_threshold;

  const canSave =
    canEdit &&
    isOnline &&
    !isSaving &&
    priceValid &&
    thresholdValid &&
    (priceChanged || thresholdChanged);

  // Margin follows what's typed, and falls back to the current selling price.
  const shownPrice = priceTyped && priceValid ? Number(price) : Number(item.sale_price);
  const avgCost = Number(item.avg_cost);
  const hasCost = Number.isFinite(avgCost) && avgCost > 0;
  const profit = shownPrice - avgCost;
  const marginPct = shownPrice > 0 ? (profit / shownPrice) * 100 : 0;

  async function handleSave() {
    if (!canSave) return;
    try {
      await onSave({
        ...(priceChanged && { salePrice: Number(Number(price).toFixed(2)) }),
        ...(thresholdChanged && { lowStockThreshold: thresholdNum }),
      });
      onClose();
    } catch {
      // onSave surfaced the error toast (incl. 403); keep the inputs for retry.
    }
  }

  const footer = canEdit ? (
    <div className="flex flex-col gap-2">
      {!isOnline && (
        <p className="flex items-center gap-1.5 text-[12px] text-amber-700">
          <WifiOff size={13} className="shrink-0" />
          {labels.offline}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-50"
        >
          {labels.cancel}
        </button>
        <button
          type="submit"
          form="product-details-form"
          disabled={!canSave}
          className="px-4 py-2 rounded-lg bg-ink-900 text-[14px] font-medium text-amber-500 hover:bg-ink-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {labels.save}
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <Drawer open onClose={handleClose} title={item.product_name} footer={footer}>
      <div className="flex flex-col gap-5">
        <div className="rounded-xl overflow-hidden border border-border">
          <ProductBanner
            id={item.product_id}
            imageUrl={item.image_url}
            height="h-40"
            categoryIcon={categoryIcon}
          />
        </div>

        {/* Stock */}
        <div className="flex items-center justify-between gap-3">
          <InvStatusBadge
            status={item.status}
            enough={labels.statusEnough}
            low={labels.statusLow}
            out={labels.statusOut}
          />
          <div className="text-end">
            <p className="text-[10px] text-ink-500 leading-none mb-0.5">{labels.currentQty}</p>
            <p className="font-mono text-[20px] font-bold text-ink-900 tabular-nums leading-none">
              {item.current_quantity}
            </p>
          </div>
        </div>

        {/* Product facts */}
        <dl className="flex flex-col gap-2 text-[13px]">
          <DetailRow label={labels.category} value={item.category_name} />
          <DetailRow
            label={labels.source}
            value={isOwnProduct ? labels.sourceOwn : labels.sourceWarehouse}
          />
          {item.barcode && <DetailRow label={labels.barcode} value={item.barcode} mono />}
          {item.description && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-ink-500">{labels.description}</dt>
              <dd dir="auto" className="text-ink-900 whitespace-pre-line">
                {item.description}
              </dd>
            </div>
          )}
        </dl>

        {/* Per-shop settings */}
        <form
          id="product-details-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          className="flex flex-col gap-4 pt-4 border-t border-border"
        >
          <div>
            <h3 className="text-[13px] font-semibold text-ink-900">{labels.shopSettings}</h3>
            <p className="text-[12px] text-ink-400 mt-0.5">
              {canEdit ? labels.shopSettingsHint : labels.readOnly}
            </p>
          </div>

          {/* Selling price */}
          <div>
            <label
              htmlFor="details-sale-price"
              className="block text-[12px] font-medium text-ink-500 mb-1.5"
            >
              {labels.salePrice}
            </label>
            {canEdit ? (
              <input
                id="details-sale-price"
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={price}
                onChange={(e) => setPrice(normalizeDecimalInput(e.target.value))}
                placeholder={formatMoney(item.sale_price)}
                className={inputClass(!priceValid)}
              />
            ) : (
              <p className="font-mono text-[15px] font-semibold text-ink-900">
                {formatMoney(item.sale_price)}
              </p>
            )}
            {!priceValid && <p className="text-[12px] text-danger-700 mt-1">{labels.errPrice}</p>}

            {/* Pricing reference + live margin — owner only, it exposes the cost basis.
                Mono on the numbers only: a monospace face breaks Arabic letter joining. */}
            {canEdit && (
              <div className="mt-2 flex flex-col gap-1 text-[12px]">
                <div className="flex justify-between text-ink-400">
                  <span>{labels.catalogDefault}</span>
                  <span className="font-mono">{formatMoney(item.price)}</span>
                </div>
                {hasCost && (
                  <>
                    <div className="flex justify-between text-ink-400">
                      <span>{labels.avgCost}</span>
                      <span className="font-mono">{formatMoney(avgCost)}</span>
                    </div>
                    <div
                      className={cn(
                        'flex justify-between font-medium',
                        profit < 0 ? 'text-danger-600' : 'text-emerald-700'
                      )}
                    >
                      <span>{labels.profitPerUnit}</span>
                      <span>
                        <span className="font-mono">{formatMoney(profit)}</span> (
                        {marginPct.toFixed(0)}% {labels.margin})
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Minimum quantity */}
          <div>
            <label
              htmlFor="details-min-qty"
              className="block text-[12px] font-medium text-ink-500 mb-1.5"
            >
              {labels.minQty}
            </label>
            {canEdit ? (
              <input
                id="details-min-qty"
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={threshold}
                // Whole numbers only; Arabic-Indic digits are rewritten to Latin.
                onChange={(e) =>
                  setThreshold(normalizeDecimalInput(e.target.value).replace(/\D/g, ''))
                }
                placeholder={String(item.low_stock_threshold)}
                className={inputClass(!thresholdValid)}
              />
            ) : (
              <p className="font-mono text-[15px] font-semibold text-ink-900">
                {item.low_stock_threshold}
              </p>
            )}
            {!thresholdValid && (
              <p className="text-[12px] text-danger-700 mt-1">{labels.errMinQty}</p>
            )}
            <p className="text-[12px] text-ink-400 mt-1.5">{labels.minQtyHint}</p>
          </div>
        </form>
      </div>
    </Drawer>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return cn(
    'w-full px-3 py-2 text-[15px] font-mono text-ink-900 bg-page border rounded-lg outline-none',
    hasError ? 'border-danger-700' : 'border-border focus:border-amber-500'
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-500 shrink-0">{label}</dt>
      <dd
        dir={mono ? 'ltr' : 'auto'}
        className={cn('min-w-0 truncate text-ink-900 font-medium', mono && 'font-mono')}
      >
        {value}
      </dd>
    </div>
  );
}
