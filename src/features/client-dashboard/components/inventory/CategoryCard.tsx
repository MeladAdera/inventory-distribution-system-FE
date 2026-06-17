import { Package } from 'lucide-react';
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

  return (
    <div
      onClick={onClick}
      className="bg-paper border border-border rounded-xl p-5 min-h-37.5 flex flex-col gap-4 cursor-pointer transition-all duration-180 hover:-translate-y-px hover:shadow-(--shadow-sm) hover:bg-sand-50"
    >
      <div className="flex items-start justify-between">
        <div className="w-10.5 h-10.5 rounded-[10px] bg-sand-100 flex items-center justify-center shrink-0">
          <Package size={20} className="text-ink-700" />
        </div>
        {hasEdits && (
          <span className="text-[13px] font-medium text-amber-700">{labels.edited}</span>
        )}
      </div>

      <div className="flex-1">
        <p className="text-[16px] font-semibold text-ink-900">{cat.name}</p>
        <p className="text-[13px] text-ink-500 mt-0.5">
          {cat.items.length} {labels.variants}
        </p>
      </div>

      <p className="text-[12px] text-ink-400">
        {labels.totalQty}: {totalQty}
      </p>
    </div>
  );
}
