import { Plus, Minus } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import { InvStatusBadge } from '../inventory/InvStatusBadge';
import type { OrderableProduct } from '../../types/clientOrderProducts.types';

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-ink-700 hover:bg-sand-100 transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

interface OrderProductCardProps {
  product: OrderableProduct;
  qty: number;
  onQty: (v: number) => void;
  labels: {
    currentQty: string;
    requestedQty: string;
    addedToOrder: string;
    statusEnough: string;
    statusLow: string;
    statusOut: string;
  };
}

export function OrderProductCard({ product, qty, onQty, labels }: OrderProductCardProps) {
  const inCart = qty > 0;

  return (
    <div
      className={cn(
        'rounded-xl p-4.5 flex flex-col gap-3.5 min-h-46 transition-all duration-150',
        inCart ? 'border-2 border-amber-600 bg-amber-50' : 'border border-border bg-paper'
      )}
    >
      {/* Row 1 — product identity + cart badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <ProductThumb id={product.id} size={38} />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-ink-900 truncate">{product.name}</p>
            <p className="font-mono text-[12px] text-ink-500">
              #{String(product.id).padStart(3, '0')}
            </p>
          </div>
        </div>
        {inCart && (
          <span className="shrink-0 bg-amber-100 text-amber-700 text-[12px] font-semibold px-2 py-0.75 rounded-full whitespace-nowrap">
            {labels.addedToOrder}
          </span>
        )}
      </div>

      {/* Row 2 — current stock */}
      <div>
        <p className="text-[12px] text-ink-500 mb-1">{labels.currentQty}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-mono text-[16px] font-semibold text-ink-900 tabular-nums">
            {product.current_quantity}
          </p>
          <InvStatusBadge
            status={product.status}
            enough={labels.statusEnough}
            low={labels.statusLow}
            out={labels.statusOut}
          />
        </div>
      </div>

      {/* Row 3 — quantity stepper */}
      <div>
        <p className="text-[12px] text-ink-500 mb-2">{labels.requestedQty}</p>
        <Stepper value={qty} onChange={onQty} />
      </div>
    </div>
  );
}
