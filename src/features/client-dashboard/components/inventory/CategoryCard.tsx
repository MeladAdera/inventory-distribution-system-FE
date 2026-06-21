import { Card, CardContent } from '@/common/components/ui/card';
import { CategoryBanner } from '@/features/categories/components/CategoryBanner';
import type { InventoryCategory } from '../../types/clientInventory.types';

interface CategoryCardProps {
  cat: InventoryCategory;
  hasEdits: boolean;
  labels: {
    edited: string;
    variants: string;
    totalQty: string;
  };
  onClick: () => void;
}

export function CategoryCard({ cat, hasEdits, labels, onClick }: CategoryCardProps) {
  const totalQty = cat.items.reduce((sum, p) => sum + p.current_quantity, 0);
  const catId = parseInt(cat.id, 10) || 0;

  return (
    <Card
      onClick={onClick}
      className="overflow-hidden cursor-pointer transition-all duration-180 hover:-translate-y-px hover:shadow-(--shadow-sm)"
    >
      <CategoryBanner id={catId} imageUrl={cat.image_url} height="h-36" />

      <CardContent className="p-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[16px] font-semibold text-ink-900">{cat.name}</p>
          <p className="text-[13px] text-ink-500 mt-0.5">
            {cat.items.length} {labels.variants}
          </p>
          <p className="text-[12px] text-ink-400 mt-0.5">
            {labels.totalQty}: {totalQty}
          </p>
        </div>
        {hasEdits && (
          <span className="shrink-0 text-[13px] font-medium text-amber-700">{labels.edited}</span>
        )}
      </CardContent>
    </Card>
  );
}
