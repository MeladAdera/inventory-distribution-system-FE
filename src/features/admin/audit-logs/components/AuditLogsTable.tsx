import { DataTable } from '@/common/components';
import type { Column } from '@/common/components/DataTable';
import { useI18n } from '@/providers/I18nProvider';
import type { AuditLog } from '../types/audit-logs.types';
import { AuditLogTypeBadge } from './AuditLogTypeBadge';

interface AuditLogsTableLabels {
  table: {
    date: string;
    shop: string;
    user: string;
    type: string;
    action: string;
    qty: string;
    notes: string;
    detail: string;
  };
  types: Record<string, string>;
  actions: Record<string, string>;
  empty: string;
}

interface AuditLogsTableProps {
  data: AuditLog[];
  isLoading: boolean;
  onView: (log: AuditLog) => void;
  labels: AuditLogsTableLabels;
}

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditLogsTable({ data, isLoading, onView, labels }: AuditLogsTableProps) {
  const { locale } = useI18n();

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: labels.table.date,
      render: (log) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-gray-500">
          {formatDate(log.created_at, locale)}
        </span>
      ),
    },
    {
      key: 'shop_name',
      header: labels.table.shop,
      render: (log) => log.shop_name ?? '—',
    },
    {
      key: 'user_name',
      header: labels.table.user,
      render: (log) => log.user_name,
    },
    {
      key: 'type',
      header: labels.table.type,
      render: (log) => (
        <AuditLogTypeBadge type={log.type} label={labels.types[log.type] ?? log.type} />
      ),
    },
    {
      key: 'action',
      header: labels.table.action,
      render: (log) => labels.actions[log.action] ?? log.action,
    },
    {
      key: 'quantity',
      header: labels.table.qty,
      render: (log) =>
        log.quantity != null ? (log.quantity > 0 ? `+${log.quantity}` : String(log.quantity)) : '—',
    },
    {
      key: 'notes',
      header: labels.table.notes,
      render: (log) => (
        <span className="line-clamp-1 max-w-xs block" title={log.notes ?? ''}>
          {log.notes ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (log) => (
        <button
          onClick={() => onView(log)}
          className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
        >
          {labels.table.detail}
        </button>
      ),
    },
  ];

  return (
    <DataTable<AuditLog>
      columns={columns}
      data={data}
      isLoading={isLoading}
      keyExtractor={(log) => log.id}
      emptyMessage={labels.empty}
    />
  );
}
