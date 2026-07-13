'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Minus, PackagePlus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { Card, CardContent } from '@/common/components/ui/card';
import type { Product } from '@/features/shared/products/types/products.types';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';

interface Props {
  open: boolean;
  /** Full warehouse catalog — including products with no inventory row yet. */
  products: Product[];
  /** Existing inventory rows, to show current stock for the picked product. */
  items: InventoryItem[];
  onClose: () => void;
  onConfirm: (productId: number, qty: number) => Promise<void>;
}

export function StockInModal({ open, products, items, onClose, onConfirm }: Props) {
  const { t } = useI18n();
  const si = t.inventory.stockIn;

  const [productId, setProductId] = useState<number | ''>('');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setProductId('');
      setQty(1);
    }
  }, [open]);

  const rowByProduct = useMemo(
    () => new Map(items.map((item) => [item.product_id, item])),
    [items]
  );

  if (!open) return null;

  const selectedRow = productId === '' ? undefined : rowByProduct.get(productId);
  const isNew = productId !== '' && !selectedRow;

  async function handleConfirm() {
    if (productId === '' || qty < 1) return;
    setLoading(true);
    try {
      await onConfirm(productId, qty);
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
              onChange={(e) => setProductId(e.target.value === '' ? '' : Number(e.target.value))}
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
