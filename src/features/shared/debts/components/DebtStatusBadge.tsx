import { cn } from '@/common/utils/cn';
import { DebtStatus } from '../types/debts.types';

// Colour follows "how much attention does this need": untouched money owed reads
// as a warning, partly paid as in-progress, settled as done, cancelled as inert.
const STATUS_STYLES: Record<DebtStatus, { bg: string; text: string; dot: string }> = {
  [DebtStatus.OPEN]: { bg: 'bg-warning-100', text: 'text-warning-700', dot: 'bg-warning-700' },
  [DebtStatus.PARTIAL]: { bg: 'bg-info-100', text: 'text-info-700', dot: 'bg-info-700' },
  [DebtStatus.PAID]: { bg: 'bg-success-100', text: 'text-success-700', dot: 'bg-success-700' },
  [DebtStatus.CANCELLED]: { bg: 'bg-sand-200', text: 'text-ink-500', dot: 'bg-ink-400' },
};

interface DebtStatusBadgeProps {
  status: DebtStatus;
  label: string;
  /** Compact variant for inline use inside a dense row. */
  small?: boolean;
}

export function DebtStatusBadge({ status, label, small }: DebtStatusBadgeProps) {
  const { bg, text, dot } = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap',
        small ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-[12px]',
        bg,
        text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {label}
    </span>
  );
}
