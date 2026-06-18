import { Package } from 'lucide-react';
import type { OrderableCategory } from '../../types/clientOrderProducts.types';

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
    <div
      onClick={onClick}
      className="bg-paper border border-border rounded-xl p-5 min-h-37.5 flex flex-col gap-4 cursor-pointer transition-all duration-180 hover:-translate-y-px hover:shadow-(--shadow-sm) hover:bg-sand-50"
    >
      <div className="flex items-start justify-between">
        <div className="w-10.5 h-10.5 rounded-[10px] bg-sand-100 flex items-center justify-center shrink-0">
          <Package size={20} className="text-ink-700" />
        </div>
        {cartCount > 0 && (
          <span className="bg-amber-100 text-amber-700 text-[12px] font-semibold px-2 py-0.75 rounded-full">
            {cartCount} {labels.addedBadge}
          </span>
        )}
      </div>

      <div className="flex-1">
        <p className="text-[16px] font-semibold text-ink-900">{category.name}</p>
        <p className="text-[13px] text-ink-500 mt-0.5">
          {category.products.length} {labels.products}
        </p>
      </div>
    </div>
  );
}
