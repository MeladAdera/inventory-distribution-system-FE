import { DataTable } from '@/common/components';
import type { Column } from '@/common/components/DataTable';
import { useI18n } from '@/providers/I18nProvider';
import type { ReceiptListItem } from '@/features/shared/receipts';

interface AdminReceiptsTableLabels {
  table: {
    receiptNo: string;
    date: string;
    shop: string;
    createdBy: string;
    items: string;
    notes: string;
    detail: string;
  };
  empty: string;
}

interface AdminReceiptsTableProps {
  data: ReceiptListItem[];
  isLoading: boolean;
  onView: (receipt: ReceiptListItem) => void;
  labels: AdminReceiptsTableLabels;
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

export function AdminReceiptsTable({ data, isLoading, onView, labels }: AdminReceiptsTableProps) {
  const { locale } = useI18n();

  const columns: Column<ReceiptListItem>[] = [
    {
      key: 'id',
      header: labels.table.receiptNo,
      render: (r) => <span className="font-mono text-sm font-semibold text-gray-700">#{r.id}</span>,
    },
    {
      key: 'created_at',
      header: labels.table.date,
      render: (r) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-gray-500">
          {formatDate(r.created_at, locale)}
        </span>
      ),
    },
    {
      key: 'shop_name',
      header: labels.table.shop,
      render: (r) => r.shop_name,
    },
    {
      key: 'created_by_name',
      header: labels.table.createdBy,
      render: (r) => r.created_by_name,
    },
    {
      key: 'total_items',
      header: labels.table.items,
      render: (r) => r.total_items,
    },
    {
      key: 'notes',
      header: labels.table.notes,
      render: (r) => (
        <span className="line-clamp-1 max-w-xs block" title={r.notes ?? ''}>
          {r.notes ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          onClick={() => onView(r)}
          className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
        >
          {labels.table.detail}
        </button>
      ),
    },
  ];

  return (
    <DataTable<ReceiptListItem>
      columns={columns}
      data={data}
      isLoading={isLoading}
      keyExtractor={(r) => r.id}
      emptyMessage={labels.empty}
    />
  );
}
