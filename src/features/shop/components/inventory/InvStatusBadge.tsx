import { cn } from '@/common/utils/cn';
import {
  StockStatus,
  type DisplayStockStatus,
} from '@/features/shared/products/types/products.types';

interface InvStatusBadgeProps {
  status: DisplayStockStatus;
  enough: string;
  low: string;
  out: string;
}

const STATUS_STYLES: Record<DisplayStockStatus, { bg: string; text: string; dot: string }> = {
  [StockStatus.HIGH_STOCK]: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    dot: 'bg-success-700',
  },
  [StockStatus.LOW_STOCK]: {
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    dot: 'bg-warning-700',
  },
  [StockStatus.OUT_OF_STOCK]: {
    bg: 'bg-danger-100',
    text: 'text-danger-700',
    dot: 'bg-danger-700',
  },
};

export function InvStatusBadge({ status, enough, low, out }: InvStatusBadgeProps) {
  const labels: Record<DisplayStockStatus, string> = {
    [StockStatus.HIGH_STOCK]: enough,
    [StockStatus.LOW_STOCK]: low,
    [StockStatus.OUT_OF_STOCK]: out,
  };

  const { bg, text, dot } = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.75 rounded-full text-xs font-medium whitespace-nowrap',
        bg,
        text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {labels[status]}
    </span>
  );
}
