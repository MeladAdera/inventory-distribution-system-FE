'use client';

import { cn } from '@/common/utils/cn';

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
  /** Rendered after the label, e.g. how many rows the chip would show. */
  count?: number;
}

interface FilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the group, e.g. "Filter receipts". */
  ariaLabel?: string;
  className?: string;
}

/**
 * A segmented switcher for one mutually-exclusive filter.
 *
 * Scrolls sideways rather than wrapping: a filter row that grows to two lines
 * on a phone pushes the list itself below the fold, which is the thing the user
 * actually came to read.
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: FilterChipsProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'flex gap-1 p-1 bg-page border border-border rounded-lg overflow-x-auto no-scrollbar',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'h-7 px-3 rounded-md text-[12px] font-semibold whitespace-nowrap transition-colors shrink-0',
              active ? 'bg-amber-600 text-white' : 'text-ink-600 hover:bg-sand-100 cursor-pointer'
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn('ms-1.5 tabular-nums', active ? 'text-white/70' : 'text-ink-400')}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
