import { cn } from '@/common/utils/cn';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  [OrderStatus.PENDING]: { bg: 'bg-sand-100', text: 'text-ink-600', dot: 'bg-ink-400' },
  [OrderStatus.PROCESSING]: {
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    dot: 'bg-warning-700',
  },
  [OrderStatus.SHIPPED]: { bg: 'bg-info-100', text: 'text-info-700', dot: 'bg-info-700' },
  [OrderStatus.RECEIVED]: { bg: 'bg-success-100', text: 'text-success-700', dot: 'bg-success-700' },
  [OrderStatus.COMPLETED]: { bg: 'bg-sand-200', text: 'text-ink-500', dot: 'bg-ink-400' },
  [OrderStatus.CANCELLED]: { bg: 'bg-danger-100', text: 'text-danger-700', dot: 'bg-danger-700' },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  label: string;
}

export function OrderStatusBadge({ status, label }: OrderStatusBadgeProps) {
  const { bg, text, dot } = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.75 rounded-full text-[12px] font-medium whitespace-nowrap',
        bg,
        text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {label}
    </span>
  );
}
