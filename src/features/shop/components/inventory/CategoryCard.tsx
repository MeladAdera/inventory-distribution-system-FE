import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/common/components/ui/card';
import { CategoryBanner } from '@/features/shared/categories/components/CategoryBanner';
import type { InventoryCategory } from '../../types/clientInventory.types';

interface CategoryCardProps {
  cat: InventoryCategory;
  hasEdits: boolean;
  labels: {
    edited: string;
    variants: string;
    totalQty: string;
    warehouseBadge?: string;
    noProducts?: string;
  };
  onClick: () => void;
  isOwned?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Square image + dense single-line label, for tight grids like the sell page's 3-per-row mobile layout. */
  compact?: boolean;
}

export function CategoryCard({
  cat,
  hasEdits,
  labels,
  onClick,
  isOwned,
  onEdit,
  onDelete,
  compact = false,
}: CategoryCardProps) {
  const totalQty = cat.items.reduce((sum, p) => sum + p.current_quantity, 0);
  const catId = parseInt(cat.id, 10) || 0;

  return (
    <Card
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer transition-all duration-180 hover:-translate-y-px hover:shadow-(--shadow-sm)"
    >
      <CategoryBanner
        id={catId}
        imageUrl={cat.image_url}
        icon={cat.icon}
        height={compact ? 'aspect-square' : 'h-36'}
      />

      {compact && hasEdits && (
        <span className="absolute top-1.5 inset-e-1.5 z-10 min-w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 shadow-sm pointer-events-none">
          {labels.edited}
        </span>
      )}

      {compact ? (
        <CardContent className="p-1.5">
          <p className="text-[12px] font-semibold text-ink-900 leading-tight truncate">
            {cat.name}
          </p>
          <p className="text-[10px] text-ink-400 leading-tight tabular-nums truncate">
            {cat.items.length === 0
              ? (labels.noProducts ?? '—')
              : `${cat.items.length} ${labels.variants}`}
          </p>
        </CardContent>
      ) : (
        <CardContent className="p-4 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold text-ink-900 truncate">{cat.name}</p>
            {cat.items.length === 0 ? (
              <p className="text-[13px] text-ink-400 mt-0.5">{labels.noProducts ?? '—'}</p>
            ) : (
              <>
                <p className="text-[13px] text-ink-500 mt-0.5">
                  {cat.items.length} {labels.variants}
                </p>
                <p className="text-[12px] text-ink-400 mt-0.5">
                  {labels.totalQty}: {totalQty}
                </p>
              </>
            )}
            {!isOwned && labels.warehouseBadge && (
              <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-sand-100 text-ink-500 border border-border">
                {labels.warehouseBadge}
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {hasEdits && (
              <span className="text-[13px] font-medium text-amber-700">{labels.edited}</span>
            )}
            {isOwned && (onEdit || onDelete) && (
              <div className="flex items-center gap-0.5 -me-1">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 hover:text-ink-700 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-ink-400 hover:bg-danger-50 hover:text-danger-700 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
