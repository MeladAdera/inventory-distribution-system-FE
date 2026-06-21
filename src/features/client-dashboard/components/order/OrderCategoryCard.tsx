import { Tag } from 'lucide-react';
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
      className="w-full h-36 rounded-t-xl overflow-hidden flex items-center justify-center"
    >
      {imageUrl ? (
        <img src={resolveImageUrl(imageUrl)} alt="" className="w-full h-full object-contain" />
      ) : (
        <Tag size={36} className="text-ink-700 opacity-40" />
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
      className="overflow-hidden cursor-pointer transition-all duration-180 hover:-translate-y-px hover:shadow-(--shadow-sm)"
    >
      <CategoryBanner id={category.id} imageUrl={category.image_url} />

      <CardContent className="p-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[16px] font-semibold text-ink-900">{category.name}</p>
          <p className="text-[13px] text-ink-500 mt-0.5">
            {category.products.length} {labels.products}
          </p>
        </div>
        {cartCount > 0 && (
          <span className="shrink-0 bg-amber-100 text-amber-700 text-[12px] font-semibold px-2 py-0.75 rounded-full">
            {cartCount} {labels.addedBadge}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
