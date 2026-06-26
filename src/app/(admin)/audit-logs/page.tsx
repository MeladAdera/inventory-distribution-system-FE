'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/common/components';
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
  const { t } = useI18n();
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
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            resetPage();
          }}
          className="input w-40"
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
          className="input w-48"
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
          className="input w-48"
        >
          <option value="">{al.filter.allUsers}</option>
          {userList.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">{al.filter.fromDate}</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              resetPage();
            }}
            className="input"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">{al.filter.toDate}</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              resetPage();
            }}
            className="input"
          />
        </div>

        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
          >
            {al.filter.clear}
          </button>
        )}
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
