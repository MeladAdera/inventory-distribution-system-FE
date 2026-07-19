'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X, Plus, Minus, PackagePlus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { Card, CardContent } from '@/common/components/ui/card';
import { formatMoney } from '@/common/utils/money';
import type { Product } from '@/features/shared/products/types/products.types';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';
import {
  COST_DEVIATION_WARN,
  parseCost,
  defaultCostInput,
  blendedAvg,
} from '../utils/inventoryCost';

interface Props {
  open: boolean;
  /** Full warehouse catalog — including products with no inventory row yet. */
  products: Product[];
  /** Existing inventory rows, to show current stock for the picked product. */
  items: InventoryItem[];
  onClose: () => void;
  onConfirm: (
    productId: number,
    qty: number,
    unitCost?: number,
    makeOrderable?: boolean
  ) => Promise<void>;
}

export function StockInModal({ open, products, items, onClose, onConfirm }: Props) {
  const { t } = useI18n();
  const si = t.inventory.stockIn;

  const [productId, setProductId] = useState<number | ''>('');
  const [qty, setQty] = useState(1);
  const [costInput, setCostInput] = useState('');
  const [makeOrderable, setMakeOrderable] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setProductId('');
      setQty(1);
      setCostInput('');
      setMakeOrderable(true);
    }
  }, [open]);

  const rowByProduct = useMemo(
    () => new Map(items.map((item) => [item.product_id, item])),
    [items]
  );

  if (!open) return null;

  const selectedRow = productId === '' ? undefined : rowByProduct.get(productId);
  const selectedProduct = productId === '' ? undefined : products.find((p) => p.id === productId);
  const isNew = productId !== '' && !selectedRow;
  // Only a catalog-only product needs this decision — an already-orderable
  // product just gets more stock, nothing to ask.
  const showOrderableToggle = selectedProduct !== undefined && !selectedProduct.is_orderable;

  const oldQty = selectedRow?.current_quantity ?? 0;
  const oldAvg = Number(selectedRow?.avg_cost);
  const hasOldAvg = Number.isFinite(oldAvg) && oldAvg > 0;
  const addCost = parseCost(costInput);
  const hasCost = !Number.isNaN(addCost) && addCost >= 0;
  const newAvg = hasCost ? blendedAvg(oldQty, oldAvg, qty, addCost) : oldAvg;
  const deviates =
    hasCost && hasOldAvg && Math.abs(addCost - oldAvg) / oldAvg > COST_DEVIATION_WARN;

  function handleProductChange(id: number | '') {
    setProductId(id);
    setCostInput(defaultCostInput(id === '' ? undefined : rowByProduct.get(id)));
    setMakeOrderable(true);
  }

  async function handleConfirm() {
    if (productId === '' || qty < 1) return;
    setLoading(true);
    try {
      const cost = parseCost(costInput);
      await onConfirm(
        productId,
        qty,
        Number.isNaN(cost) ? undefined : cost,
        showOrderableToggle ? makeOrderable : undefined
      );
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <Card className="relative w-full max-w-sm shadow-xl">
        <CardContent className="p-6 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink-900">{si.title}</h2>
              <p className="mt-0.5 text-sm text-ink-500">{si.subtitle}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-ink-400 -mt-1 -me-1"
            >
              <X size={15} />
            </Button>
          </div>

          {/* Product picker */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">{si.productLabel}</label>
            <select
              value={productId}
              onChange={(e) =>
                handleProductChange(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full h-10 border border-border rounded-lg bg-paper text-[13px] text-ink-800 px-3 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-50 cursor-pointer"
            >
              <option value="">{si.productPlaceholder}</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selected product stock info */}
          {selectedRow && (
            <div className="flex items-center justify-between bg-sand-100 rounded-xl px-4 py-3">
              <span className="text-sm text-ink-500">{si.currentStock}</span>
              <span className="text-sm font-semibold text-ink-900 tabular-nums">
                {selectedRow.current_quantity}
              </span>
            </div>
          )}
          {isNew && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-sm text-amber-700">{si.newBadge}</span>
            </div>
          )}

          {/* Qty stepper */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">{si.qtyLabel}</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="rounded-lg shrink-0"
              >
                <Minus size={14} />
              </Button>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="text-center font-semibold tabular-nums h-9"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQty((q) => q + 1)}
                className="rounded-lg shrink-0"
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* Unit cost + blended-average preview */}
          {productId !== '' && (
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                {si.unitCostLabel}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                dir="ltr"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 text-[13px] font-mono text-ink-900 bg-page border border-border rounded-lg outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              {(hasCost || hasOldAvg) && (
                <p className="mt-1.5 text-[12px] font-mono text-ink-400">
                  {si.avgCostLabel}: {hasOldAvg ? `${formatMoney(oldAvg)} → ` : ''}
                  <span className="text-ink-700 font-medium">{formatMoney(newAvg)}</span>
                </p>
              )}
              {deviates && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-amber-700">
                  <AlertTriangle size={12} className="shrink-0" />
                  <span>{si.costWarning}</span>
                </div>
              )}
            </div>
          )}

          {/* Catalog-only product: offer to mark it orderable in the same step */}
          {showOrderableToggle && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={makeOrderable}
                  onChange={(e) => setMakeOrderable(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 shrink-0"
                />
                <span className="text-sm text-amber-800">{si.makeOrderableLabel}</span>
              </label>
              <p className="mt-1.5 text-[12px] text-amber-700">{si.makeOrderableHint}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
              {si.cancel}
            </Button>
            <Button
              variant="default"
              size="md"
              onClick={handleConfirm}
              disabled={productId === '' || loading}
              className="flex-1 gap-1.5"
            >
              <PackagePlus size={14} />
              {loading ? '…' : si.confirm}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
