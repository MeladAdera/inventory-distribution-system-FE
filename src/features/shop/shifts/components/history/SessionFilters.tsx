'use client';

import { X } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { ShiftSessionStatus } from '../../types/shifts.types';

export interface SessionFilterValues {
  from?: string;
  to?: string;
  userId?: number;
  status?: ShiftSessionStatus;
}

interface SessionFiltersProps {
  value: SessionFilterValues;
  onChange: (next: SessionFilterValues) => void;
  /** Everyone who could have worked a shift — owner included. */
  people: { id: number; name: string }[];
  labels: {
    from: string;
    to: string;
    employee: string;
    allEmployees: string;
    status: string;
    allStatuses: string;
    open: string;
    closed: string;
    clear: string;
  };
}

export function SessionFilters({ value, onChange, people, labels }: SessionFiltersProps) {
  const isFiltered = Boolean(value.from || value.to || value.userId || value.status);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label={labels.from}>
        <input
          type="date"
          className="input"
          value={value.from ?? ''}
          onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
        />
      </Field>

      <Field label={labels.to}>
        <input
          type="date"
          className="input"
          value={value.to ?? ''}
          onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
        />
      </Field>

      <Field label={labels.employee}>
        <select
          className="input"
          value={value.userId ?? ''}
          onChange={(e) =>
            onChange({ ...value, userId: e.target.value ? Number(e.target.value) : undefined })
          }
        >
          <option value="">{labels.allEmployees}</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={labels.status}>
        <select
          className="input"
          value={value.status ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              status: e.target.value ? (e.target.value as ShiftSessionStatus) : undefined,
            })
          }
        >
          <option value="">{labels.allStatuses}</option>
          <option value={ShiftSessionStatus.OPEN}>{labels.open}</option>
          <option value={ShiftSessionStatus.CLOSED}>{labels.closed}</option>
        </select>
      </Field>

      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          <X size={14} />
          {labels.clear}
        </Button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-32 flex-1 flex-col gap-1 sm:flex-none">
      <span className="text-[12px] text-ink-500">{label}</span>
      {children}
    </label>
  );
}
