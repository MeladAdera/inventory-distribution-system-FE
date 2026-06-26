'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useAuditLogs } from '@/features/admin/audit-logs';
import { AuditLogType } from '@/features/admin/audit-logs';
import type { AuditLog } from '@/features/admin/audit-logs';
import { TypewriterText } from '@/common/components/TypewriterText';
import { AuditLogsTableCard } from './audit-logs/AuditLogsTableCard';
import { AuditLogDetailModal } from './audit-logs/AuditLogDetailModal';

const LIMIT = 15;

export function ClientAuditLogsPage() {
  const { t, locale } = useI18n();
  const al = t.client.auditLogs;

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const params = {
    page,
    limit: LIMIT,
    ...(typeFilter ? { type: typeFilter as AuditLogType } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const { logs, total, totalPages, isLoading, error } = useAuditLogs(params);

  function handleTypeChange(value: string) {
    setTypeFilter(value);
    setPage(1);
  }

  function handleFromDateChange(value: string) {
    setFromDate(value);
    setPage(1);
  }

  function handleToDateChange(value: string) {
    setToDate(value);
    setPage(1);
  }

  function handleClearFilters() {
    setTypeFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  function handleView(log: AuditLog) {
    setSelectedLogId(log.id);
    setModalOpen(true);
  }

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]">{al.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={28} className="text-danger-500" />
        <p className="text-[14px] text-ink-600">{al.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto">
      {/* Header */}
      <div className="mb-5.5">
        <h1 className="text-[26px] font-semibold text-ink-900">
          <TypewriterText phrases={al.taglines} />
        </h1>
        <p className="text-[14px] text-ink-500 mt-1">
          {total} {al.title.toLowerCase()}
        </p>
      </div>

      <AuditLogsTableCard
        logs={logs}
        typeFilter={typeFilter}
        fromDate={fromDate}
        toDate={toDate}
        onTypeChange={handleTypeChange}
        onFromDateChange={handleFromDateChange}
        onToDateChange={handleToDateChange}
        onClearFilters={handleClearFilters}
        onView={handleView}
        locale={locale}
        labels={{
          filter: al.filter,
          table: al.table,
          types: al.types,
          actions: al.actions,
          entity: al.entity,
          empty: al.empty,
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-[13px] text-ink-400">
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>
            <span className="h-9 px-3 flex items-center text-[13px] text-ink-600 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      )}

      <AuditLogDetailModal
        logId={selectedLogId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        locale={locale}
        labels={al.modal}
        typeLabels={al.types}
        actionLabels={al.actions}
        entityLabels={al.entity}
      />
    </div>
  );
}
