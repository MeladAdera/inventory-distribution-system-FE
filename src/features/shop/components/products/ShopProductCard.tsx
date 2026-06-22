'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/common/components/ui/card';
import { ProductBanner } from '@/features/shared/products/components/ProductBanner';
import type { Product } from '@/features/shared/products/types/products.types';

interface ShopProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

export function ShopProductCard({ product, onEdit, onDelete }: ShopProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <ProductBanner id={product.id} imageUrl={product.image_url} height="h-28" />

      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink-900 truncate">{product.name}</p>
            <p className="text-[12px] text-ink-400 mt-0.5 truncate">{product.category_name}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 -me-1">
            <button
              onClick={onEdit}
              className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 hover:text-ink-700 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-ink-400 hover:bg-danger-50 hover:text-danger-700 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <p className="text-[13px] font-semibold text-amber-700 mt-2" dir="ltr">
          {Number(product.price).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </CardContent>
    </Card>
  );
}
