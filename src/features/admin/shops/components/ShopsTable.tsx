import { DataTable, Badge } from '@/common/components';
import type { Column } from '@/common/components';
import type { BadgeVariant } from '@/common/components/Badge';
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
  const baseColumns: Column<Shop>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'address',
      header: 'Address',
      render: (shop) => shop.address ?? '—',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (shop) => shop.phone ?? '—',
    },
    {
      key: 'type',
      header: 'Type',
      render: (shop) => (
        <Badge variant={typeBadgeVariant[shop.type as ShopType]}>
          {shop.type.charAt(0) + shop.type.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Active',
      render: (shop) => (
        <Badge variant={shop.is_active ? 'success' : 'danger'}>
          {shop.is_active ? 'Active' : 'Inactive'}
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
            Edit
          </button>
        )}
        {canToggleStatus && (
          <button
            onClick={() => onToggleStatus(shop)}
            className={`text-xs font-medium hover:underline ${
              shop.is_active ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {shop.is_active ? 'Deactivate' : 'Activate'}
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
      keyExtractor={(s) => s.id}
      emptyMessage="No shops found"
    />
  );
}
