import { cn } from '@/common/utils/cn';
import { getCategoryIcon } from '@/features/shared/categories/utils/categoryIcons';

export interface ChipCategory {
  name: string;
  icon: string | null;
}

interface CategoryChipsProps {
  categories: ChipCategory[];
  /** null = all categories */
  active: string | null;
  onSelect: (category: string | null) => void;
  allLabel: string;
}

export function CategoryChips({ categories, active, onSelect, allLabel }: CategoryChipsProps) {
  const chips: { key: string | null; label: string; icon: string | null }[] = [
    { key: null, label: allLabel, icon: null },
    ...categories.map(({ name, icon }) => ({ key: name, label: name, icon })),
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
      {chips.map(({ key, label, icon }) => {
        const Icon = key === null ? null : getCategoryIcon(icon);
        return (
          <button
            key={key ?? '__all__'}
            onClick={() => onSelect(key)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap shrink-0',
              active === key
                ? 'bg-ink-900 text-amber-500'
                : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
            )}
          >
            {Icon && <Icon size={13} className="shrink-0" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
