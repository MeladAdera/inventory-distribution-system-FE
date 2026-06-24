import { Minus, Plus } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Card, CardContent } from '@/common/components/ui/card';
import { ProductBanner } from '@/features/shared/products/components/ProductBanner';
import { InvStatusBadge } from '../inventory/InvStatusBadge';
import type { OrderableProduct } from '../../types/clientOrderProducts.types';

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
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        inCart
          ? 'border-amber-400 shadow-sm shadow-amber-100'
          : 'hover:-translate-y-px hover:shadow-sm'
      )}
    >
      <div className="relative">
        <ProductBanner id={product.id} imageUrl={product.image_url} height="h-32" />
        {inCart && (
          <span className="absolute top-2.5 inset-e-2.5 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {labels.addedToOrder}
          </span>
        )}
      </div>

      <CardContent className="p-3 flex flex-col gap-2">
        {/* Name */}
        <p className="text-[14px] font-semibold text-ink-900 leading-snug truncate">
          {product.name}
        </p>

        {/* Status + current qty inline */}
        <div className="flex items-center justify-between gap-2">
          <InvStatusBadge
            status={product.status}
            enough={labels.statusEnough}
            low={labels.statusLow}
            out={labels.statusOut}
          />
          <div className="text-right shrink-0">
            <p className="text-[10px] text-ink-500 leading-none mb-0.5">{labels.currentQty}</p>
            <p className="font-mono text-[18px] font-bold text-ink-900 tabular-nums leading-none">
              {product.current_quantity}
            </p>
          </div>
        </div>

        {/* Quantity pill stepper */}
        <div className="pt-1.5 border-t border-border">
          <div
            className={cn(
              'flex items-center rounded-2xl border bg-paper shadow-sm overflow-hidden transition-colors',
              inCart ? 'border-amber-300' : 'border-border'
            )}
          >
            <button
              onClick={() => onQty(Math.max(0, qty - 1))}
              disabled={qty === 0}
              className="w-10 h-10 flex items-center justify-center text-ink-400 hover:text-ink-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-[9px] text-ink-400 leading-none mb-0.5">
                {labels.requestedQty}
              </span>
              <span
                className={cn(
                  'font-mono text-[15px] font-bold tabular-nums leading-none',
                  qty > 0 ? 'text-amber-600' : 'text-ink-300'
                )}
              >
                {qty === 0 ? '—' : qty}
              </span>
            </div>

            <button
              onClick={() => onQty(qty + 1)}
              className="w-10 h-10 flex items-center justify-center text-ink-400 hover:text-ink-700 transition-colors shrink-0"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
