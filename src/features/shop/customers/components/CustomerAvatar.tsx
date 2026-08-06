'use client';

import { cn } from '@/common/utils/cn';

interface CustomerAvatarProps {
  name: string;
  /** Dimmed for a removed customer, so the row reads as inactive at a glance. */
  muted?: boolean;
  size?: 'sm' | 'md';
}

/**
 * First letter of the name in a tinted disc.
 *
 * `Array.from` rather than `name[0]`: a name starting with an emoji or any
 * astral character would otherwise render half a surrogate pair.
 */
function initial(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toUpperCase() : '?';
}

const sizes = {
  sm: 'w-8 h-8 text-[13px]',
  md: 'w-10 h-10 text-[15px]',
};

export function CustomerAvatar({ name, muted, size = 'md' }: CustomerAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 rounded-full flex items-center justify-center font-semibold select-none',
        sizes[size],
        muted ? 'bg-sand-200 text-ink-400' : 'bg-amber-100 text-amber-700'
      )}
    >
      {initial(name)}
    </span>
  );
}
