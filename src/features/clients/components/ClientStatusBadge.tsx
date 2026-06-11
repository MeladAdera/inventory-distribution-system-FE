import { cn } from '@/common/utils/cn';
import type { ClientStatus } from '../types/clients.types';

interface ClientStatusBadgeProps {
  status: ClientStatus;
  label: string;
}

export function ClientStatusBadge({ status, label }: ClientStatusBadgeProps) {
  const isActive = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
        isActive ? 'bg-success-100 text-success-700' : 'bg-ink-200/60 text-ink-500'
      )}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-success-700' : 'bg-ink-400')}
      />
      {label}
    </span>
  );
}
