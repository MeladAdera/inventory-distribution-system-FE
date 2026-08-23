'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Modal } from '@/common/components/Modal';
import { Button } from '@/common/components/ui/button';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useUsers } from '@/features/admin/users/hooks/useUsers';
import { UserRole } from '@/features/auth/types/enums';
import type { User } from '@/features/admin/users/types/users.types';
import type { ShiftTemplate } from '../../types/shifts.types';

interface AssignModalProps {
  open: boolean;
  onClose: () => void;
  template: ShiftTemplate;
  onSubmit: (userIds: number[]) => Promise<void>;
  isSubmitting: boolean;
  labels: {
    title: string;
    intro: string;
    loading: string;
    empty: string;
    selectedCount: string;
    clearAll: string;
    submit: string;
    cancel: string;
  };
}

/**
 * The rota for one slot — a full replace, not a merge.
 *
 * Several people on one slot is intended, not a mistake: a weekly template is
 * worked by whoever covers that week, and a colleague standing in should not be
 * flagged as unscheduled. Who is actually working right now is settled by the
 * open session, never by this list.
 */
export function AssignModal({
  open,
  onClose,
  template,
  onSubmit,
  isSubmitting,
  labels,
}: AssignModalProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { users, isLoading } = useUsers({ role: UserRole.EMPLOYEE });

  // Only active employees may be assigned; a deactivated one is rejected with
  // shift.ASSIGNEE_NOT_EMPLOYEE, and the server drops them from rotas by itself.
  const employees: User[] = ((users?.data?.data as User[]) ?? []).filter((u) => u.is_active);

  useEffect(() => {
    if (!open) return;
    setSelected(template.assignees.map((a) => a.id));
    setError(null);
  }, [open, template]);

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    setError(null);
    try {
      // Sent whole — an empty list is how a rota is cleared.
      await onSubmit(selected);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={labels.title.replace('{name}', template.name)}
      size="sm"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-ink-400">
            {labels.selectedCount.replace('{count}', String(selected.length))}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              {labels.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {labels.submit}
            </Button>
          </div>
        </div>
      }
    >
      <p className="text-[13px] leading-relaxed text-ink-500">{labels.intro}</p>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-ink-500">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-[13px]">{labels.loading}</span>
        </div>
      ) : employees.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-ink-400">{labels.empty}</p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-border">
            {employees.map((employee) => {
              const on = selected.includes(employee.id);
              return (
                <li key={employee.id}>
                  <button
                    type="button"
                    onClick={() => toggle(employee.id)}
                    className="flex w-full items-center gap-3 py-2.5 text-start transition-colors hover:bg-sand-100"
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                        on ? 'border-amber-600 bg-amber-600 text-white' : 'border-border'
                      )}
                    >
                      {on && <Check size={13} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-ink-800">
                        {employee.name}
                      </span>
                      <span className="block truncate text-[12px] text-ink-400">
                        {employee.email}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="mt-3 text-[12px] font-medium text-amber-700 hover:underline"
            >
              {labels.clearAll}
            </button>
          )}
        </>
      )}

      {error && <p className="mt-3 text-[13px] text-danger-700">{error}</p>}
    </Modal>
  );
}
