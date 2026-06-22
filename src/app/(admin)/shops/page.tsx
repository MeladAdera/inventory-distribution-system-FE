'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/common/components';
import { usePermission } from '@/common/hooks/usePermission';
import { useShops } from '@/features/admin/shops';
import { ShopsTable } from '@/features/admin/shops/components/ShopsTable';
import { EditShopModal } from '@/features/admin/shops/components/EditShopModal';
import { ToggleShopStatusDialog } from '@/features/admin/shops/components/ToggleShopStatusDialog';
import { ShopType } from '@/features/admin/shops';
import type { Shop } from '@/features/admin/shops';

const LIMIT = 10;

export default function ShopsPage() {
  const router = useRouter();
  const { isEmployee, isWarehouseAdmin, isShopOwner } = usePermission();

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ShopType | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [editTarget, setEditTarget] = useState<Shop | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Shop | null>(null);

  useEffect(() => {
    if (isEmployee) router.replace('/dashboard');
  }, [isEmployee, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = {
    page,
    limit: LIMIT,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { shops, isLoading, error } = useShops(params);

  const shopList: Shop[] = shops?.data ?? [];
  const total: number = shops?.total ?? 0;

  const handleMutationSuccess = useCallback(() => {
    setEditTarget(null);
    setToggleTarget(null);
  }, []);

  if (isEmployee) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shops</h1>
          <p className="mt-1 text-sm text-gray-500">Manage shops and their status</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="input max-w-xs"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as ShopType | '');
            setPage(1);
          }}
          className="input w-44"
        >
          <option value="">All types</option>
          <option value={ShopType.WAREHOUSE}>Warehouse</option>
          <option value={ShopType.SHOP}>Shop</option>
        </select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Failed to load shops. Please try refreshing the page.
        </div>
      )}

      <ShopsTable
        data={shopList}
        isLoading={isLoading}
        canEdit={isWarehouseAdmin || isShopOwner}
        canToggleStatus={isWarehouseAdmin}
        onEdit={setEditTarget}
        onToggleStatus={setToggleTarget}
      />

      {total > LIMIT && (
        <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      )}

      <EditShopModal
        open={!!editTarget}
        shop={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={handleMutationSuccess}
      />

      <ToggleShopStatusDialog
        open={!!toggleTarget}
        shop={toggleTarget}
        onClose={() => setToggleTarget(null)}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
