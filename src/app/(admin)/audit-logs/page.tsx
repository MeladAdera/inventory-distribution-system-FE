'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination, DatePickerButton } from '@/common/components';
import { usePermission } from '@/common/hooks/usePermission';
import { useI18n } from '@/providers/I18nProvider';
import { useAuditLogs } from '@/features/admin/audit-logs';
import { AuditLogType } from '@/features/admin/audit-logs';
import type { AuditLog } from '@/features/admin/audit-logs';
import { AuditLogsTable } from '@/features/admin/audit-logs/components/AuditLogsTable';
import { AuditLogDetailModal } from '@/features/admin/audit-logs/components/AuditLogDetailModal';
import { useShops } from '@/features/admin/shops';
import { useUsers } from '@/features/admin/users';
import type { Shop } from '@/features/admin/shops';
import type { User } from '@/features/admin/users';

const LIMIT = 15;

export default function AuditLogsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const al = t.auditLogs;
  const { isEmployee } = usePermission();

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [shopId, setShopId] = useState('');
  const [userId, setUserId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (isEmployee) router.replace('/dashboard');
  }, [isEmployee, router]);

  // Populate shop and user selects
  const { shops: shopsData } = useShops();
  const { users: usersData } = useUsers({ limit: 100 });
  const shopList: Shop[] = shopsData?.data ?? [];
  const userList: User[] = usersData?.data?.data ?? [];

  const hasActiveFilter = !!(typeFilter || shopId || userId || fromDate || toDate);

  const params = {
    page,
    limit: LIMIT,
    ...(typeFilter ? { type: typeFilter as AuditLogType } : {}),
    ...(shopId ? { shopId: Number(shopId) } : {}),
    ...(userId ? { userId: Number(userId) } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const { logs, total, isLoading, error } = useAuditLogs(params);

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setTypeFilter('');
    setShopId('');
    setUserId('');
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  if (isEmployee) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{al.page.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{al.page.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
        {/* Row 1: category selects — equal width, never wrap */}
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              resetPage();
            }}
            className="input flex-1"
          >
            <option value="">{al.filter.typeAll}</option>
            <option value={AuditLogType.INVENTORY}>{al.filter.typeInventory}</option>
            <option value={AuditLogType.ORDER}>{al.filter.typeOrder}</option>
          </select>

          <select
            value={shopId}
            onChange={(e) => {
              setShopId(e.target.value);
              resetPage();
            }}
            className="input flex-1"
          >
            <option value="">{al.filter.allShops}</option>
            {shopList.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>

          <select
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              resetPage();
            }}
            className="input flex-1"
          >
            <option value="">{al.filter.allUsers}</option>
            {userList.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Row 2: date range + clear */}
        <div className="flex flex-wrap items-center gap-2">
          <DatePickerButton
            value={fromDate}
            onChange={(v) => {
              setFromDate(v);
              resetPage();
            }}
            placeholder={al.filter.fromDate}
            locale={locale}
          />
          <span className="text-gray-300 text-sm">—</span>
          <DatePickerButton
            value={toDate}
            onChange={(v) => {
              setToDate(v);
              resetPage();
            }}
            placeholder={al.filter.toDate}
            locale={locale}
          />

          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-sm text-amber-600 hover:text-amber-800 font-medium underline underline-offset-2"
            >
              {al.filter.clear}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{al.page.loadError}</div>
      )}

      <AuditLogsTable
        data={logs}
        isLoading={isLoading}
        onView={setSelectedLog}
        labels={{
          table: al.table,
          types: al.types,
          actions: al.actions,
          empty: al.empty,
        }}
      />

      {total > LIMIT && (
        <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      )}

      <AuditLogDetailModal
        logId={selectedLog?.id ?? null}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        labels={al.modal}
        typeLabels={al.types}
        actionLabels={al.actions}
        entityLabels={al.entity}
      />
    </div>
  );
}
