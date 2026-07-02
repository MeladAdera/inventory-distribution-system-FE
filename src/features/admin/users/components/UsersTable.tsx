'use client';

import { DataTable, Badge } from '@/common/components';
import type { Column } from '@/common/components';
import type { BadgeVariant } from '@/common/components/Badge';
import { useI18n } from '@/providers/I18nProvider';
import { UserRole } from '@/features/auth/types/enums';
import type { User } from '../types/users.types';

const roleBadgeVariant: Record<UserRole, BadgeVariant> = {
  [UserRole.WAREHOUSE_ADMIN]: 'info',
  [UserRole.SHOP_OWNER]: 'warning',
  [UserRole.EMPLOYEE]: 'default',
};

interface UsersTableProps {
  data: User[];
  isLoading: boolean;
  canEdit: boolean;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
  onReactivate: (user: User) => void;
  reactivatingId: number | null;
}

export function UsersTable({
  data,
  isLoading,
  canEdit,
  onEdit,
  onDeactivate,
  onReactivate,
  reactivatingId,
}: UsersTableProps) {
  const { t, locale } = useI18n();
  const u = t.users;

  const baseColumns: Column<User>[] = [
    { key: 'name', header: u.table.name },
    { key: 'email', header: u.table.email },
    {
      key: 'role',
      header: u.table.role,
      render: (user) => (
        <Badge variant={roleBadgeVariant[user.role as UserRole]}>
          {u.roles[user.role as keyof typeof u.roles] ?? user.role}
        </Badge>
      ),
    },
    {
      key: 'shop_id',
      header: u.table.shop,
      render: (user) => (user.shop_id ? `#${user.shop_id}` : '—'),
    },
    {
      key: 'is_active',
      header: u.table.status,
      render: (user) => (
        <Badge variant={user.is_active ? 'success' : 'danger'}>
          {user.is_active ? u.table.active : u.table.inactive}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: u.table.created,
      render: (user) =>
        new Date(user.created_at).toLocaleDateString(
          locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB',
          { day: 'numeric', month: 'short', year: 'numeric' }
        ),
    },
  ];

  const actionColumn: Column<User> = {
    key: 'actions',
    header: '',
    render: (user) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(user)}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          {u.table.edit}
        </button>
        {user.is_active ? (
          <button
            onClick={() => onDeactivate(user)}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            {u.table.deactivate}
          </button>
        ) : (
          <button
            onClick={() => onReactivate(user)}
            disabled={reactivatingId === user.id}
            className="text-xs font-medium text-green-600 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {u.table.activate}
          </button>
        )}
      </div>
    ),
  };

  const columns = canEdit ? [...baseColumns, actionColumn] : baseColumns;

  return (
    <DataTable<User>
      columns={columns}
      data={data}
      isLoading={isLoading}
      keyExtractor={(u) => u.id}
      emptyMessage={u.table.empty}
    />
  );
}
