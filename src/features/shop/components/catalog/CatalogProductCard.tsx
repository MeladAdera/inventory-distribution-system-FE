import { Check, Loader2, Plus } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatMoney } from '@/common/utils/money';
import { ProductBanner } from '@/features/shared/products/components/ProductBanner';
import type { CatalogProduct } from '../../types/catalog.types';

export interface CatalogCardLabels {
  add: string;
  adding: string;
  added: string;
  notInShop: string;
  /** "In your shop · {qty} in stock" */
  inShopStock: string;
  inShopOut: string;
}

interface CatalogProductCardProps {
  item: CatalogProduct;
  isAdding: boolean;
  onAdd: () => void;
  labels: CatalogCardLabels;
}

export function CatalogProductCard({ item, isAdding, onAdd, labels }: CatalogProductCardProps) {
  const meta = item.in_inventory
    ? item.current_quantity > 0
      ? labels.inShopStock.replace('{qty}', String(item.current_quantity))
      : labels.inShopOut
    : labels.notInShop;

  return (
    <div className="flex flex-col bg-paper border border-border rounded-xl overflow-hidden">
      <ProductBanner id={item.id} imageUrl={item.image_url} height="h-24" />

      <div className="flex flex-col gap-1 p-2.5 flex-1">
        <p className="text-[13px] font-semibold text-ink-900 leading-tight truncate">{item.name}</p>
        <p className="font-mono text-[12px] text-ink-500 tabular-nums">{formatMoney(item.price)}</p>
        <p
          className={cn(
            'text-[11px] leading-snug tabular-nums',
            item.in_inventory ? 'text-success-700 font-medium' : 'text-ink-400'
          )}
        >
          {meta}
        </p>

        {item.in_inventory ? (
          <span className="mt-auto inline-flex items-center justify-center gap-1 w-full h-8 rounded-lg bg-success-100 text-success-700 text-[12px] font-semibold">
            <Check size={13} strokeWidth={2.5} />
            {labels.added}
          </span>
        ) : (
          <button
            onClick={onAdd}
            disabled={isAdding}
            className={cn(
              'mt-auto inline-flex items-center justify-center gap-1 w-full h-8 rounded-lg text-[12px] font-semibold text-white transition-all',
              isAdding
                ? 'bg-amber-600 cursor-wait'
                : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.97]'
            )}
          >
            {isAdding ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                {labels.adding}
              </>
            ) : (
              <>
                <Plus size={13} strokeWidth={2.5} />
                {labels.add}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
