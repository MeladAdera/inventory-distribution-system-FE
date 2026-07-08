import { Eye, ScrollText } from 'lucide-react';
import { AuditLogType } from '@/features/admin/audit-logs';
import type { AuditLog } from '@/features/admin/audit-logs';
import { DatePickerButton } from '@/common/components';
import { AuditLogTypeBadge } from './AuditLogTypeBadge';

function formatDateTime(iso: string, locale: 'ar' | 'en'): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

interface AuditLogsTableCardLabels {
  filter: {
    typeAll: string;
    typeInventory: string;
    typeOrder: string;
    fromDate: string;
    toDate: string;
    clear: string;
  };
  table: {
    date: string;
    user: string;
    type: string;
    action: string;
    entity: string;
    qty: string;
    receiptId: string;
  };
  types: Record<string, string>;
  actions: Record<string, string>;
  entity: Record<string, string>;
  empty: { title: string; sub: string };
}

interface AuditLogsTableCardProps {
  logs: AuditLog[];
  typeFilter: string;
  fromDate: string;
  toDate: string;
  onTypeChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClearFilters: () => void;
  onView: (log: AuditLog) => void;
  locale: 'ar' | 'en';
  labels: AuditLogsTableCardLabels;
}

export function AuditLogsTableCard({
  logs,
  typeFilter,
  fromDate,
  toDate,
  onTypeChange,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
  onView,
  locale,
  labels,
}: AuditLogsTableCardProps) {
  const hasActiveFilter = typeFilter !== '' || fromDate !== '' || toDate !== '';

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* Toolbar — mobile */}
      <div className="sm:hidden flex flex-col gap-2 px-4 py-3.5 border-b border-border">
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="h-10 w-full px-3 border border-border rounded-lg text-[14px] text-ink-700 bg-paper outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">{labels.filter.typeAll}</option>
          <option value={AuditLogType.INVENTORY}>{labels.filter.typeInventory}</option>
          <option value={AuditLogType.ORDER}>{labels.filter.typeOrder}</option>
        </select>

        <div className="flex items-center gap-2">
          <DatePickerButton
            value={fromDate}
            onChange={onFromDateChange}
            placeholder={labels.filter.fromDate}
            locale={locale}
            className="flex-1 justify-center"
          />
          <span className="text-ink-300 text-sm shrink-0">—</span>
          <DatePickerButton
            value={toDate}
            onChange={onToDateChange}
            placeholder={labels.filter.toDate}
            locale={locale}
            className="flex-1 justify-center"
          />
        </div>

        {hasActiveFilter && (
          <button
            onClick={onClearFilters}
            className="self-start text-[13px] text-amber-700 font-medium hover:text-amber-900 transition-colors"
          >
            {labels.filter.clear}
          </button>
        )}
      </div>

      {/* Toolbar — desktop */}
      <div className="hidden sm:flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border">
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="h-9 w-40 px-3 border border-border rounded-lg text-[13px] text-ink-700 bg-paper outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">{labels.filter.typeAll}</option>
          <option value={AuditLogType.INVENTORY}>{labels.filter.typeInventory}</option>
          <option value={AuditLogType.ORDER}>{labels.filter.typeOrder}</option>
        </select>

        <DatePickerButton
          value={fromDate}
          onChange={onFromDateChange}
          placeholder={labels.filter.fromDate}
          locale={locale}
        />
        <span className="text-ink-300">—</span>
        <DatePickerButton
          value={toDate}
          onChange={onToDateChange}
          placeholder={labels.filter.toDate}
          locale={locale}
        />

        {hasActiveFilter && (
          <button
            onClick={onClearFilters}
            className="h-9 px-3 text-[13px] text-ink-500 hover:text-ink-800 underline underline-offset-2 transition-colors"
          >
            {labels.filter.clear}
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <ScrollText size={32} className="text-ink-400" />
          <p className="text-[15px] font-medium text-ink-700">{labels.empty.title}</p>
          <p className="text-[13px] text-ink-400">{labels.empty.sub}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.7fr_1.6fr_40px] items-center gap-3 bg-sand-100 border-b border-border px-5 py-3">
              {[
                labels.table.date,
                labels.table.user,
                labels.table.type,
                labels.table.action,
                labels.table.qty,
                labels.table.receiptId,
                '',
              ].map((col, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold tracking-wider uppercase text-ink-400"
                >
                  {col}
                </span>
              ))}
            </div>

            {logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.7fr_1.6fr_40px] items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-sand-50 transition-colors"
              >
                <span className="text-[12px] text-ink-500 tabular-nums">
                  {formatDateTime(log.created_at, locale)}
                </span>

                <span className="text-[13px] text-ink-700 font-medium truncate">
                  {log.user_name}
                </span>

                <AuditLogTypeBadge type={log.type} label={labels.types[log.type] ?? log.type} />

                <span className="text-[13px] text-ink-600">
                  {labels.actions[log.action] ?? log.action}
                </span>

                <span className="text-[13px] text-ink-500 tabular-nums">
                  {log.quantity != null
                    ? log.quantity > 0
                      ? `+${log.quantity}`
                      : String(log.quantity)
                    : '—'}
                </span>

                <span className="text-[13px] text-ink-500 tabular-nums">
                  {log.receipt_id != null ? `#${log.receipt_id}` : '—'}
                </span>

                <button
                  onClick={() => onView(log)}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border text-[12px] font-medium text-ink-700 hover:bg-sand-100 transition-colors whitespace-nowrap"
                >
                  <Eye size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-4 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-ink-800">{log.user_name}</span>
                    <AuditLogTypeBadge type={log.type} label={labels.types[log.type] ?? log.type} />
                  </div>
                  <button
                    onClick={() => onView(log)}
                    className="flex items-center gap-1 px-3 h-8 rounded-lg bg-ink-900 text-amber-500 text-[12px] font-semibold hover:bg-ink-800 transition-colors shrink-0"
                  >
                    <Eye size={13} />
                  </button>
                </div>

                <p className="text-[13px] text-ink-600">
                  {labels.actions[log.action] ?? log.action}
                  {log.quantity != null && (
                    <span className="ml-2 text-ink-400 tabular-nums">
                      ({log.quantity > 0 ? `+${log.quantity}` : String(log.quantity)})
                    </span>
                  )}
                </p>

                {log.receipt_id != null && (
                  <p className="text-[12px] text-ink-400">
                    {labels.table.receiptId}:{' '}
                    <span className="tabular-nums">#{log.receipt_id}</span>
                  </p>
                )}

                <p className="text-[11px] text-ink-400 tabular-nums">
                  {formatDateTime(log.created_at, locale)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
