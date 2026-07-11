import { useEffect, useState } from 'react';
import { ShoppingCart, Pencil, Trash2, Minus, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatMoney } from '@/common/utils/money';
import { ProductBanner } from '@/features/shared/products/components/ProductBanner';
import { InvStatusBadge } from './InvStatusBadge';
import { Card, CardContent } from '@/common/components/ui/card';
import type { EnrichedInventoryItem } from '../../types/clientInventory.types';
import type { SyncItemStatus } from '@/features/shared/inventory/offline/stockSyncEngine';

export interface ProductCardLabels {
  currentQty: string;
  updateQty: string;
  orderMore: string;
  statusEnough: string;
  statusLow: string;
  statusOut: string;
  newQty: string;
  pendingSync: string;
  conflict: string;
  price: string;
}

interface ProductCardProps {
  item: EnrichedInventoryItem;
  delta: number;
  onDelta: (v: number) => void;
  labels: ProductCardLabels;
  onOrderMore: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onEditPrice?: () => void;
  // Set when this item has an unsynced change waiting in the offline queue.
  syncStatus?: SyncItemStatus;
}

export function ProductCard({
  item,
  delta,
  onDelta,
  labels,
  onOrderMore,
  onEdit,
  onDelete,
  onEditPrice,
  syncStatus,
}: ProductCardProps) {
  const newQty = item.current_quantity + delta;
  const [inputValue, setInputValue] = useState(delta === 0 ? '' : String(delta));

  useEffect(() => {
    setInputValue(delta === 0 ? '' : String(delta));
  }, [delta]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setInputValue(raw);
    if (raw === '' || raw === '-') return;
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    onDelta(Math.max(-item.current_quantity, parsed));
  }

  function handleInputBlur() {
    setInputValue(delta === 0 ? '' : String(delta));
  }

  return (
    <Card className="overflow-hidden">
      <ProductBanner id={item.product_id} imageUrl={item.image_url} height="h-32" />

      <CardContent className="p-3 flex flex-col gap-2">
        {/* Name + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-ink-900 leading-snug truncate">
              {item.product_name}
            </p>
            {syncStatus === 'pending' && (
              <span className="inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <RefreshCw size={9} className="animate-spin" />
                {labels.pendingSync}
              </span>
            )}
            {syncStatus === 'conflict' && (
              <span className="inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-danger-50 text-danger-700 border border-danger-200">
                <AlertTriangle size={9} />
                {labels.conflict}
              </span>
            )}
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-0.5 shrink-0 -me-0.5 -mt-0.5">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 hover:text-ink-700 transition-colors"
                >
                  <Pencil size={13} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:bg-danger-50 hover:text-danger-700 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status badge + qty inline */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <InvStatusBadge
              status={item.status}
              enough={labels.statusEnough}
              low={labels.statusLow}
              out={labels.statusOut}
            />
            <button
              onClick={onOrderMore}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition-colors whitespace-nowrap"
            >
              <ShoppingCart size={10} />
              {labels.orderMore}
            </button>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-ink-500 leading-none mb-0.5">{labels.currentQty}</p>
            <p className="font-mono text-[18px] font-bold text-ink-900 tabular-nums leading-none">
              {item.current_quantity}
            </p>
          </div>
        </div>

        {/* Selling price — tap to edit (per-shop, applies to local + warehouse) */}
        {onEditPrice && (
          <button
            onClick={onEditPrice}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-paper hover:bg-sand-100 transition-colors"
          >
            <span className="text-[11px] text-ink-500">{labels.price}</span>
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-[13px] font-semibold text-ink-900">
                {formatMoney(item.sale_price)}
              </span>
              <Pencil size={11} className="text-ink-400" />
            </span>
          </button>
        )}

        {/* Adjustment stepper — full-width pill */}
        <div className="pt-1.5 border-t border-border">
          <div className="flex items-center rounded-2xl border border-border bg-paper shadow-sm overflow-hidden">
            <button
              onClick={() => onDelta(Math.max(-item.current_quantity, delta - 1))}
              disabled={delta <= -item.current_quantity}
              className="w-10 h-10 flex items-center justify-center text-ink-400 hover:text-ink-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-[9px] text-ink-400 leading-none mb-0.5">
                {labels.updateQty}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="—"
                dir="ltr"
                className={cn(
                  'w-12 bg-transparent text-center outline-none font-mono text-[15px] font-bold tabular-nums leading-none placeholder:text-ink-300',
                  delta > 0 ? 'text-success-700' : delta < 0 ? 'text-danger-700' : 'text-ink-300'
                )}
              />
            </div>

            <button
              onClick={() => onDelta(delta + 1)}
              className="w-10 h-10 flex items-center justify-center text-ink-400 hover:text-ink-700 transition-colors shrink-0"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>

          {delta !== 0 && (
            <p className="text-[10px] text-ink-400 mt-1 text-center">
              {labels.newQty}:{' '}
              <span className="font-mono font-semibold text-ink-700">{newQty}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
