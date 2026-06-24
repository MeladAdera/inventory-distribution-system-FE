'use client';

import { DataTable, Badge } from '@/common/components';
import type { Column } from '@/common/components';
import type { BadgeVariant } from '@/common/components/Badge';
import { useI18n } from '@/providers/I18nProvider';
import { ShopType } from '../types/shops.types';
import type { Shop } from '../types/shops.types';

const typeBadgeVariant: Record<ShopType, BadgeVariant> = {
  [ShopType.WAREHOUSE]: 'info',
  [ShopType.SHOP]: 'default',
};

interface ShopsTableProps {
  data: Shop[];
  isLoading: boolean;
  canEdit: boolean;
  canToggleStatus: boolean;
  onEdit: (shop: Shop) => void;
  onToggleStatus: (shop: Shop) => void;
}

export function ShopsTable({
  data,
  isLoading,
  canEdit,
  canToggleStatus,
  onEdit,
  onToggleStatus,
}: ShopsTableProps) {
  const { t } = useI18n();
  const s = t.shops;

  const baseColumns: Column<Shop>[] = [
    { key: 'name', header: s.table.name },
    {
      key: 'address',
      header: s.table.address,
      render: (shop) => shop.address ?? '—',
    },
    {
      key: 'phone',
      header: s.table.phone,
      render: (shop) => shop.phone ?? '—',
    },
    {
      key: 'type',
      header: s.table.type,
      render: (shop) => (
        <Badge variant={typeBadgeVariant[shop.type as ShopType]}>
          {s.types[shop.type as keyof typeof s.types] ?? shop.type}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: s.table.status,
      render: (shop) => (
        <Badge variant={shop.is_active ? 'success' : 'danger'}>
          {shop.is_active ? s.table.active : s.table.inactive}
        </Badge>
      ),
    },
  ];

  const actionColumn: Column<Shop> = {
    key: 'actions',
    header: '',
    render: (shop) => (
      <div className="flex items-center gap-2">
        {canEdit && (
          <button
            onClick={() => onEdit(shop)}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {s.table.edit}
          </button>
        )}
        {canToggleStatus && (
          <button
            onClick={() => onToggleStatus(shop)}
            className={`text-xs font-medium hover:underline ${
              shop.is_active ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {shop.is_active ? s.table.deactivate : s.table.activate}
          </button>
        )}
      </div>
    ),
  };

  const columns = canEdit || canToggleStatus ? [...baseColumns, actionColumn] : baseColumns;

  return (
    <DataTable<Shop>
      columns={columns}
      data={data}
      isLoading={isLoading}
      keyExtractor={(sh) => sh.id}
      emptyMessage={s.table.empty}
    />
  );
}
