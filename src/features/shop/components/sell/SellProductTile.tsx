import { Package } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import type { OrderableProduct } from '../../types/clientOrderProducts.types';

const PALETTE = ['#FAEACB', '#F8EBD3', '#DDE6F3', '#DCEBE9', '#F6DDDB', '#F5EFE4'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveImageUrl(url: string) {
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

interface SellProductTileProps {
  product: OrderableProduct;
  qty: number;
  onTap: () => void;
  labels: {
    stock: string;
    outOfStock: string;
  };
}

export function SellProductTile({ product, qty, onTap, labels }: SellProductTileProps) {
  const selected = qty > 0;
  const outOfStock = product.current_quantity === 0;
  const color = PALETTE[product.id % PALETTE.length];

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={outOfStock}
      className={cn(
        'relative flex flex-col w-full rounded-xl border bg-paper overflow-hidden text-start',
        'transition-all duration-100 select-none touch-manipulation',
        outOfStock
          ? 'opacity-45 cursor-not-allowed'
          : 'cursor-pointer active:scale-[0.95] hover:shadow-sm',
        selected
          ? 'border-amber-400 ring-1 ring-amber-300 shadow-sm shadow-amber-100'
          : 'border-border'
      )}
    >
      {/* Quantity badge */}
      {selected && (
        <span className="absolute top-1.5 inset-e-1.5 z-10 min-w-5.5 h-5.5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center px-1.5 tabular-nums shadow-sm pointer-events-none">
          ×{qty}
        </span>
      )}

      {/* Thumb */}
      <div
        style={{ backgroundColor: color }}
        className="w-full h-16 sm:h-20 flex items-center justify-center overflow-hidden"
      >
        {product.image_url ? (
          <img
            src={resolveImageUrl(product.image_url)}
            alt=""
            className="w-full h-full object-contain"
          />
        ) : (
          <Package size={24} className="text-ink-700 opacity-40" />
        )}
      </div>

      {/* Name + stock */}
      <div className="flex flex-col gap-0.5 px-2 py-1.5 w-full">
        <p className="text-[12px] font-semibold text-ink-900 leading-tight truncate">
          {product.name}
        </p>
        <p
          className={cn(
            'text-[10px] leading-none tabular-nums',
            outOfStock ? 'text-danger-500 font-medium' : 'text-ink-400'
          )}
        >
          {outOfStock ? labels.outOfStock : `${labels.stock}: ${product.current_quantity}`}
        </p>
      </div>
    </button>
  );
}
