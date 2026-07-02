'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { Button } from '@/common/components/ui/button';
import { Input } from '@/common/components/ui/input';
import { Card, CardContent } from '@/common/components/ui/card';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';

interface Props {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onConfirm: (item: InventoryItem, qty: number) => Promise<void>;
}

export function InventoryRestockModal({ open, item, onClose, onConfirm }: Props) {
  const { t } = useI18n();
  const iv = t.inventory.restock;

  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setQty(1);
  }, [open]);

  if (!open || !item) return null;

  const name = item.product_name ?? `Product ${item.product_id}`;

  async function handleConfirm() {
    if (!item || qty < 1) return;
    setLoading(true);
    try {
      await onConfirm(item, qty);
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
              <h2 className="text-base font-semibold text-ink-900">{iv.title}</h2>
              <p className="mt-0.5 text-sm text-ink-500">{iv.subtitle.replace('{name}', name)}</p>
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

          {/* Current quantity info */}
          <div className="flex items-center justify-between bg-sand-100 rounded-xl px-4 py-3">
            <span className="text-sm text-ink-500">{iv.currentStock}</span>
            <span className="text-sm font-semibold text-ink-900 tabular-nums">
              {item.current_quantity}
            </span>
          </div>

          {/* Qty stepper */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">{iv.label}</label>
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
              {iv.cancel}
            </Button>
            <Button
              variant="default"
              size="md"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1"
            >
              {loading ? '…' : iv.confirm}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
