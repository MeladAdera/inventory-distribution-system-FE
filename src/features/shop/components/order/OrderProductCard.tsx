import { Plus, Minus, Package } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Card, CardContent } from '@/common/components/ui/card';
import { Button } from '@/common/components/ui/button';
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
      className="w-full h-36 overflow-hidden flex items-center justify-center"
    >
      {imageUrl ? (
        <img src={resolveImageUrl(imageUrl)} alt="" className="w-full h-full object-contain" />
      ) : (
        <Package size={40} className="text-ink-700 opacity-30" />
      )}
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="secondary"
        size="icon"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        className="h-8 w-8 rounded-lg"
      >
        <Minus size={13} />
      </Button>
      <span className="font-mono text-[18px] font-bold text-ink-900 w-10 text-center tabular-nums select-none">
        {value}
      </span>
      <Button size="icon" onClick={() => onChange(value + 1)} className="h-8 w-8 rounded-lg">
        <Plus size={13} />
      </Button>
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
        'overflow-hidden transition-all duration-200',
        inCart
          ? 'border-amber-400 shadow-sm shadow-amber-100'
          : 'hover:-translate-y-px hover:shadow-sm'
      )}
    >
      <div className="relative">
        <ProductBanner id={product.id} imageUrl={product.image_url} />
        {inCart && (
          <span className="absolute top-3 inset-e-3 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {labels.addedToOrder}
          </span>
        )}
      </div>

      <CardContent className="p-4 flex flex-col gap-3">
        <p className="text-[15px] font-semibold text-ink-900 leading-snug">{product.name}</p>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-ink-400">{labels.currentQty}:</span>
          <span className="font-mono text-[13px] font-semibold text-ink-800 tabular-nums">
            {product.current_quantity}
          </span>
          <InvStatusBadge
            status={product.status}
            enough={labels.statusEnough}
            low={labels.statusLow}
            out={labels.statusOut}
          />
        </div>

        <div
          className={cn(
            'flex items-center justify-between pt-2.5 border-t border-border',
            inCart && 'border-amber-200'
          )}
        >
          <span className="text-[12px] text-ink-500 font-medium">{labels.requestedQty}</span>
          <Stepper value={qty} onChange={onQty} />
        </div>
      </CardContent>
    </Card>
  );
}
