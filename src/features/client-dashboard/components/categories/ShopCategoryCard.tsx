'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/common/components/ui/card';
import { CategoryBanner } from '@/features/categories/components/CategoryBanner';
import type { Category } from '@/features/categories/types/categories.types';

interface ShopCategoryCardProps {
  category: Category;
  isOwned: boolean;
  warehouseBadgeLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function ShopCategoryCard({
  category,
  isOwned,
  warehouseBadgeLabel,
  onEdit,
  onDelete,
}: ShopCategoryCardProps) {
  return (
    <Card className="overflow-hidden">
      <CategoryBanner id={category.id} imageUrl={category.image_url} height="h-28" />

      <CardContent className="p-3.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink-900 truncate">{category.name}</p>
          {!isOwned && (
            <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-sand-100 text-ink-500 border border-border">
              {warehouseBadgeLabel}
            </span>
          )}
        </div>

        {isOwned && (
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
        )}
      </CardContent>
    </Card>
  );
}
