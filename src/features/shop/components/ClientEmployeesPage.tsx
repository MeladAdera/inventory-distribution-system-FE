'use client';

import { useState } from 'react';
import { Plus, Loader2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useUsers } from '@/features/admin/users/hooks/useUsers';
import { UserRole } from '@/features/auth/types/enums';
import { CreateEmployeeModal } from '@/features/admin/users/components/CreateEmployeeModal';
import { EditUserModal } from '@/features/admin/users/components/EditUserModal';
import { DeactivateUserDialog } from '@/features/admin/users/components/DeactivateUserDialog';
import { EmployeesTableCard } from './employees/EmployeesTableCard';
import type { User } from '@/features/admin/users/types/users.types';

export function ClientEmployeesPage() {
  const { t } = useI18n();
  const emp = t.client.employees;

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);

  const { users, isLoading, error } = useUsers({ role: UserRole.EMPLOYEE });

  const employees: User[] = users?.data?.data ?? [];
  const total: number = users?.data?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]">{emp.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={28} className="text-danger-500" />
        <p className="text-[14px] text-ink-600">{emp.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5.5">
        <div>
          <h1 className="text-[26px] font-semibold text-ink-900">{emp.title}</h1>
          <p className="text-[14px] text-ink-500 mt-1">
            {total} {emp.count}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors shrink-0"
        >
          <Plus size={15} />
          {emp.addBtn}
        </button>
      </div>

      <EmployeesTableCard
        employees={employees}
        onEdit={setEditUser}
        onDeactivate={setDeactivateUser}
        onAdd={() => setCreateOpen(true)}
        labels={{
          table: emp.table,
          empty: emp.empty,
          addBtn: emp.addBtn,
        }}
      />

      <CreateEmployeeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => setCreateOpen(false)}
      />

      <EditUserModal
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSuccess={() => setEditUser(null)}
      />

      <DeactivateUserDialog
        open={!!deactivateUser}
        user={deactivateUser}
        onClose={() => setDeactivateUser(null)}
        onSuccess={() => setDeactivateUser(null)}
      />
    </div>
  );
}
