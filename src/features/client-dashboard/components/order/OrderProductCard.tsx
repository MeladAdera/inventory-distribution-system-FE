import { Plus, Minus, Package } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Card, CardContent } from '@/common/components/ui/card';
import { InvStatusBadge } from '../inventory/InvStatusBadge';
import type { OrderableProduct } from '../../types/clientOrderProducts.types';

const PALETTE = ['#FAEACB', '#F8EBD3', '#DDE6F3', '#DCEBE9', '#F6DDDB', '#F5EFE4'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveImageUrl(url: string) {
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function ProductBanner({ id, imageUrl }: { id: number; imageUrl: string | null }) {
  const color = PALETTE[id % PALETTE.length];
  return (
    <div
      style={{ backgroundColor: color }}
      className="w-full h-40 rounded-t-xl overflow-hidden flex items-center justify-center"
    >
      {imageUrl ? (
        <img src={resolveImageUrl(imageUrl)} alt="" className="w-full h-full object-contain" />
      ) : (
        <Package size={40} className="text-ink-700 opacity-40" />
      )}
    </div>
  );
}

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
    <Card
      className={cn(
        'overflow-hidden transition-all duration-150',
        inCart ? 'border-2 border-amber-600' : ''
      )}
    >
      <ProductBanner id={product.id} imageUrl={product.image_url} />

      <CardContent className="p-4 flex flex-col gap-3">
        {/* Name + cart badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold text-ink-900 leading-snug">{product.name}</p>
          {inCart && (
            <span className="shrink-0 bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
              {labels.addedToOrder}
            </span>
          )}
        </div>

        {/* Current stock */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-ink-500">{labels.currentQty}:</span>
          <span className="font-mono text-[13px] font-semibold text-ink-900 tabular-nums">
            {product.current_quantity}
          </span>
          <InvStatusBadge
            status={product.status}
            enough={labels.statusEnough}
            low={labels.statusLow}
            out={labels.statusOut}
          />
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <span className="text-[12px] text-ink-500">{labels.requestedQty}</span>
          <Stepper value={qty} onChange={onQty} />
        </div>
      </CardContent>
    </Card>
  );
}
