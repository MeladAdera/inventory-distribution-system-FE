import { ShoppingCart, Pencil, Trash2 } from 'lucide-react';
import { Stepper } from '@/common/components/Stepper';
import { ProductBanner } from '@/features/shared/products/components/ProductBanner';
import { InvStatusBadge } from './InvStatusBadge';
import { Card, CardContent } from '@/common/components/ui/card';
import type { EnrichedInventoryItem } from '../../types/clientInventory.types';

export interface ProductCardLabels {
  currentQty: string;
  updateQty: string;
  orderMore: string;
  statusEnough: string;
  statusLow: string;
  statusOut: string;
  newQty: string;
}

interface ProductCardProps {
  item: EnrichedInventoryItem;
  delta: number;
  onDelta: (v: number) => void;
  labels: ProductCardLabels;
  onOrderMore: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProductCard({
  item,
  delta,
  onDelta,
  labels,
  onOrderMore,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const newQty = item.current_quantity + delta;

  return (
    <Card className="overflow-hidden">
      <ProductBanner id={item.product_id} imageUrl={item.image_url} height="h-40" />

      <CardContent className="p-4 flex flex-col gap-3">
        {/* Name + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink-900 leading-snug truncate">
              {item.product_name}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              <InvStatusBadge
                status={item.status}
                enough={labels.statusEnough}
                low={labels.statusLow}
                out={labels.statusOut}
              />
              <button
                onClick={onOrderMore}
                className="inline-flex items-center gap-1 px-2.5 py-0.75 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition-colors whitespace-nowrap"
              >
                <ShoppingCart size={11} />
                {labels.orderMore}
              </button>
            </div>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex items-center gap-0.5 shrink-0 -me-1 -mt-0.5">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 hover:text-ink-700 transition-colors"
                >
                  <Pencil size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-ink-400 hover:bg-danger-50 hover:text-danger-700 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Current quantity */}
        <div>
          <p className="text-[12px] text-ink-500 mb-1">{labels.currentQty}</p>
          <p className="font-mono text-[24px] font-bold text-ink-900 tabular-nums leading-none">
            {item.current_quantity}
          </p>
        </div>

        {/* Adjustment stepper */}
        <div className="pt-1 border-t border-border">
          <p className="text-[12px] text-ink-500 mb-2">{labels.updateQty}</p>
          <Stepper value={delta} onChange={onDelta} min={-item.current_quantity} />
          {delta !== 0 && (
            <p className="text-[12px] text-ink-400 mt-1.5">
              {labels.newQty}:{' '}
              <span className="font-mono font-semibold text-ink-700">{newQty}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
