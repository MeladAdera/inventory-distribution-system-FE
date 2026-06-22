'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Pagination } from '@/common/components';
import { usePermission } from '@/common/hooks/usePermission';
import { useUsers } from '@/features/users';
import { UsersTable } from '@/features/users/components/UsersTable';
import { CreateShopOwnerModal } from '@/features/users/components/CreateShopOwnerModal';
import { CreateEmployeeModal } from '@/features/users/components/CreateEmployeeModal';
import { EditUserModal } from '@/features/users/components/EditUserModal';
import { DeactivateUserDialog } from '@/features/users/components/DeactivateUserDialog';
import { UserRole } from '@/features/auth/types/enums';
import type { User } from '@/features/users';

const LIMIT = 10;

export default function UsersPage() {
  const router = useRouter();
  const { isEmployee, isWarehouseAdmin, isShopOwner } = usePermission();

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showCreateShopOwner, setShowCreateShopOwner] = useState(false);
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);

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
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { users, isLoading, error } = useUsers(params);

  const usersData = users?.data;
  const userList: User[] = usersData?.data ?? [];
  const total: number = usersData?.total ?? 0;

  const handleMutationSuccess = useCallback(() => {
    setShowCreateShopOwner(false);
    setShowCreateEmployee(false);
    setEditTarget(null);
    setDeactivateTarget(null);
  }, []);

  if (isEmployee) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage team members and their access</p>
        </div>
        <div className="flex gap-3">
          {isWarehouseAdmin && (
            <Button onClick={() => setShowCreateShopOwner(true)}>+ Create Shop Owner</Button>
          )}
          {isShopOwner && (
            <Button onClick={() => setShowCreateEmployee(true)}>+ Create Employee</Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="input max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | '');
            setPage(1);
          }}
          className="input w-44"
        >
          <option value="">All roles</option>
          <option value={UserRole.WAREHOUSE_ADMIN}>Warehouse Admin</option>
          <option value={UserRole.SHOP_OWNER}>Shop Owner</option>
          <option value={UserRole.EMPLOYEE}>Employee</option>
        </select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Failed to load users. Please try refreshing the page.
        </div>
      )}

      <UsersTable
        data={userList}
        isLoading={isLoading}
        canEdit={isWarehouseAdmin || isShopOwner}
        onEdit={setEditTarget}
        onDeactivate={setDeactivateTarget}
      />

      {total > LIMIT && (
        <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      )}

      <CreateShopOwnerModal
        open={showCreateShopOwner}
        onClose={() => setShowCreateShopOwner(false)}
        onSuccess={handleMutationSuccess}
      />
      <CreateEmployeeModal
        open={showCreateEmployee}
        onClose={() => setShowCreateEmployee(false)}
        onSuccess={handleMutationSuccess}
      />
      <EditUserModal
        open={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={handleMutationSuccess}
      />
      <DeactivateUserDialog
        open={!!deactivateTarget}
        user={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
