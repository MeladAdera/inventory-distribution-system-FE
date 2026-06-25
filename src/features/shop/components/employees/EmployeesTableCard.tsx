import { Users, Pencil, UserX } from 'lucide-react';
import type { User } from '@/features/admin/users/types/users.types';

interface EmployeesTableCardProps {
  employees: User[];
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
  onAdd: () => void;
  labels: {
    table: {
      name: string;
      email: string;
      status: string;
      active: string;
      inactive: string;
      editBtn: string;
      deactivateBtn: string;
      empty: string;
    };
    empty: {
      title: string;
      sub: string;
    };
    addBtn: string;
  };
}

function StatusPill({
  active,
  labels,
}: {
  active: boolean;
  labels: { active: string; inactive: string };
}) {
  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium border ${
        active
          ? 'bg-teal-50 text-teal-700 border-teal-200'
          : 'bg-red-50 text-red-600 border-red-200'
      }`}
    >
      {active ? labels.active : labels.inactive}
    </span>
  );
}

export function EmployeesTableCard({
  employees,
  onEdit,
  onDeactivate,
  onAdd,
  labels,
}: EmployeesTableCardProps) {
  if (employees.length === 0) {
    return (
      <div className="bg-paper border border-border rounded-xl overflow-hidden">
        <div className="flex flex-col items-center py-16 gap-3 text-center px-6">
          <Users size={32} className="text-ink-400" />
          <p className="text-[15px] font-medium text-ink-700">{labels.empty.title}</p>
          <p className="text-[13px] text-ink-500">{labels.empty.sub}</p>
          <button
            onClick={onAdd}
            className="mt-1 flex items-center gap-2 px-4 h-9 rounded-lg bg-amber-600 text-white text-[13px] font-semibold hover:bg-amber-700 transition-colors"
          >
            {labels.addBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* Desktop table */}
      <div className="hidden sm:block">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_0.6fr_auto] items-center gap-4 bg-sand-100 border-b border-border px-6 py-3">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
            {labels.table.name}
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
            {labels.table.email}
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
            {labels.table.status}
          </span>
          <span className="w-32" />
        </div>

        {employees.map((emp) => (
          <div
            key={emp.id}
            className="grid grid-cols-[1fr_1fr_0.6fr_auto] items-center gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-sand-50 transition-colors"
          >
            <span className="text-[13px] font-medium text-ink-900 truncate">{emp.name}</span>
            <span className="text-[13px] text-ink-600 truncate">{emp.email}</span>
            <StatusPill active={emp.is_active} labels={labels.table} />
            <div className="w-32 flex items-center justify-end gap-2">
              <button
                onClick={() => onEdit(emp)}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
              >
                <Pencil size={13} />
                {labels.table.editBtn}
              </button>
              {emp.is_active && (
                <button
                  onClick={() => onDeactivate(emp)}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-red-200 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <UserX size={13} />
                  {labels.table.deactivateBtn}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden flex flex-col divide-y divide-border">
        {employees.map((emp) => (
          <div key={emp.id} className="px-5 py-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ink-900 truncate">{emp.name}</p>
                <p className="text-[13px] text-ink-500 truncate mt-0.5">{emp.email}</p>
              </div>
              <StatusPill active={emp.is_active} labels={labels.table} />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onEdit(emp)}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
              >
                <Pencil size={13} />
                {labels.table.editBtn}
              </button>
              {emp.is_active && (
                <button
                  onClick={() => onDeactivate(emp)}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-red-200 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <UserX size={13} />
                  {labels.table.deactivateBtn}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
