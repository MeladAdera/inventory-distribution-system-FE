'use client';

import { cn } from '@/common/utils/cn';

interface SupplierAvatarProps {
  name: string;
  /** Dimmed for a removed supplier, so the row reads as inactive at a glance. */
  muted?: boolean;
  size?: 'sm' | 'md';
}

/**
 * First letter of the name in a tinted square.
 *
 * A square, where a customer's is a disc: suppliers are businesses, customers
 * are people, and the two lists sit one nav item apart.
 *
 * `Array.from` rather than `name[0]`: a name starting with an emoji or any
 * astral character would otherwise render half a surrogate pair.
 */
function initial(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toUpperCase() : '?';
}

const sizes = {
  sm: 'w-8 h-8 text-[13px] rounded-lg',
  md: 'w-10 h-10 text-[15px] rounded-xl',
};

export function SupplierAvatar({ name, muted, size = 'md' }: SupplierAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 flex items-center justify-center font-semibold select-none',
        sizes[size],
        muted ? 'bg-sand-200 text-ink-400' : 'bg-info-100 text-info-700'
      )}
    >
      {initial(name)}
    </span>
  );
}
