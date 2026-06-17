import { ShoppingCart } from 'lucide-react';
import { Stepper } from '@/common/components/Stepper';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import { StockStatus } from '@/features/products/types/products.types';
import { InvStatusBadge } from './InvStatusBadge';
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
}

export function ProductCard({ item, delta, onDelta, labels, onOrderMore }: ProductCardProps) {
  const sku = item.barcode ?? `#${String(item.product_id).padStart(4, '0')}`;
  const newQty = item.current_quantity + delta;

  return (
    <div className="bg-paper border border-border rounded-xl p-4.5 flex flex-col gap-3.5">
      {/* Product identity */}
      <div className="flex items-center gap-3">
        <ProductThumb id={item.product_id} size={38} />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-ink-900 truncate">{item.product_name}</p>
          <p className="font-mono text-[12px] text-ink-500">{sku}</p>
        </div>
      </div>

      {/* Status + order-more shortcut */}
      <div className="flex items-center gap-2 flex-wrap">
        <InvStatusBadge
          status={item.status}
          enough={labels.statusEnough}
          low={labels.statusLow}
          out={labels.statusOut}
        />
        {item.status === StockStatus.OUT_OF_STOCK && (
          <button
            onClick={onOrderMore}
            className="inline-flex items-center gap-1 px-2.5 py-0.75 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition-colors whitespace-nowrap"
          >
            <ShoppingCart size={11} />
            {labels.orderMore}
          </button>
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
      <div>
        <p className="text-[12px] text-ink-500 mb-2">{labels.updateQty}</p>
        <Stepper value={delta} onChange={onDelta} min={-item.current_quantity} />
        {delta !== 0 && (
          <p className="text-[12px] text-ink-400 mt-1.5">
            {labels.newQty}: <span className="font-mono font-semibold text-ink-700">{newQty}</span>
          </p>
        )}
      </div>
    </div>
  );
}
