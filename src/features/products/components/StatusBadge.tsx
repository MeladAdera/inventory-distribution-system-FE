import { cn } from '@/common/utils/cn';
import type { ProductStatus } from '../types/products.types';

const CFG: Record<ProductStatus, { dot: string; text: string; bg: string }> = {
  in_stock: { dot: 'bg-success-700', text: 'text-success-700', bg: 'bg-success-100' },
  low: { dot: 'bg-warning-700', text: 'text-warning-700', bg: 'bg-warning-100' },
  out: { dot: 'bg-danger-700', text: 'text-danger-700', bg: 'bg-danger-100' },
  inactive: { dot: 'bg-ink-500', text: 'text-ink-500', bg: 'bg-sand-200' },
};

interface StatusBadgeProps {
  status: ProductStatus;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { dot, text, bg } = CFG[status];
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
