import { cn } from '@/common/utils/cn';

interface CategoryChipsProps {
  categories: string[];
  /** null = all categories */
  active: string | null;
  onSelect: (category: string | null) => void;
  allLabel: string;
}

export function CategoryChips({ categories, active, onSelect, allLabel }: CategoryChipsProps) {
  const chips: { key: string | null; label: string }[] = [
    { key: null, label: allLabel },
    ...categories.map((name) => ({ key: name, label: name })),
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
      {chips.map(({ key, label }) => (
        <button
          key={key ?? '__all__'}
          onClick={() => onSelect(key)}
          className={cn(
            'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap shrink-0',
            active === key
              ? 'bg-ink-900 text-amber-500'
              : 'bg-sand-100 text-ink-600 hover:bg-sand-200'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
