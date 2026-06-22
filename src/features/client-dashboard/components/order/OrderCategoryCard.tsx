import { Tag } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Card, CardContent } from '@/common/components/ui/card';
import type { OrderableCategory } from '../../types/clientOrderProducts.types';

const PALETTE = ['#FAEACB', '#F8EBD3', '#DDE6F3', '#DCEBE9', '#F6DDDB', '#F5EFE4'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveImageUrl(url: string) {
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function CategoryBanner({ id, imageUrl }: { id: number; imageUrl: string | null }) {
  const color = PALETTE[id % PALETTE.length];
  return (
    <div
      style={{ backgroundColor: color }}
      className="w-full h-36 overflow-hidden flex items-center justify-center"
    >
      {imageUrl ? (
        <img src={resolveImageUrl(imageUrl)} alt="" className="w-full h-full object-contain" />
      ) : (
        <Tag size={36} className="text-ink-700 opacity-30" />
      )}
    </div>
  );
}

interface OrderCategoryCardProps {
  category: OrderableCategory;
  cartCount: number;
  onClick: () => void;
  labels: {
    addedBadge: string;
    products: string;
  };
}

export function OrderCategoryCard({
  category,
  cartCount,
  onClick,
  labels,
}: OrderCategoryCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        cartCount > 0 && 'border-amber-400 shadow-sm shadow-amber-100'
      )}
    >
      <div className="relative">
        <CategoryBanner id={category.id} imageUrl={category.image_url} />
        {cartCount > 0 && (
          <span className="absolute top-3 inset-e-3 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {cartCount} {labels.addedBadge}
          </span>
        )}
      </div>

      <CardContent className="px-4 py-3.5">
        <p className="text-[15px] font-semibold text-ink-900 group-hover:text-amber-700 transition-colors leading-tight">
          {category.name}
        </p>
        <p className="text-[12px] text-ink-400 mt-0.5">
          {category.products.length} {labels.products}
        </p>
      </CardContent>
    </Card>
  );
}
