import { cn } from '@/common/utils/cn';

interface StatusBadgeProps {
  isActive: boolean;
  label: string;
}

export function StatusBadge({ isActive, label }: StatusBadgeProps) {
  const { dot, text, bg } = isActive
    ? { dot: 'bg-success-700', text: 'text-success-700', bg: 'bg-success-100' }
    : { dot: 'bg-ink-500', text: 'text-ink-500', bg: 'bg-sand-200' };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.75 rounded-full text-xs font-medium whitespace-nowrap',
        bg,
        text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {label}
    </span>
  );
}
