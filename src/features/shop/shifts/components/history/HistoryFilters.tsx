'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { FilterChips } from '@/common/components';
import { Button } from '@/common/components/ui/button';
import { DATE_PRESETS, type HistoryFilters as Filters } from '../../hooks/useHistoryFilters';
import { ShiftSessionStatus } from '../../types/shifts.types';

export interface HistoryFilterLabels {
  presets: Record<(typeof DATE_PRESETS)[number], string>;
  from: string;
  to: string;
  employee: string;
  allEmployees: string;
  status: string;
  allStatuses: string;
  open: string;
  closed: string;
  varianceOnly: string;
  clear: string;
  filterBtn: string;
}

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onReset: () => void;
  people: { id: number; name: string }[];
  labels: HistoryFilterLabels;
  /** Renders the controls stacked for the mobile sheet. */
  stacked?: boolean;
}

/**
 * The filter controls, shared by the desktop toolbar and the mobile sheet.
 *
 * One component for both so the two can never drift into offering different
 * filters — only the arrangement changes.
 */
export function HistoryFilterControls({
  filters,
  onChange,
  onReset,
  people,
  labels,
  stacked = false,
}: Props) {
  const isFiltered =
    filters.preset !== 'week' || filters.userId || filters.status || filters.varianceOnly;

  return (
    <div className={cn(stacked ? 'flex flex-col gap-4' : 'flex flex-wrap items-end gap-3')}>
      {/* The presets carry their own meaning; a label above them would only
          repeat the words already on the pills. */}
      <Field label="" stacked={stacked} wide>
        <FilterChips
          options={DATE_PRESETS.map((p) => ({ value: p, label: labels.presets[p] }))}
          value={filters.preset}
          onChange={(preset) => onChange({ preset })}
        />
      </Field>

      {/* Explicit dates only matter once the presets have been stepped past. */}
      {filters.preset === 'custom' && (
        <>
          <Field label={labels.from} stacked={stacked}>
            <input
              type="date"
              className="input"
              value={filters.from ?? ''}
              onChange={(e) => onChange({ from: e.target.value || undefined })}
            />
          </Field>
          <Field label={labels.to} stacked={stacked}>
            <input
              type="date"
              className="input"
              value={filters.to ?? ''}
              onChange={(e) => onChange({ to: e.target.value || undefined })}
            />
          </Field>
        </>
      )}

      <Field label={labels.employee} stacked={stacked}>
        <select
          className="input"
          value={filters.userId ?? ''}
          onChange={(e) =>
            onChange({ userId: e.target.value ? Number(e.target.value) : undefined })
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

      <Field label={labels.status} stacked={stacked}>
        <select
          className="input"
          value={filters.status ?? ''}
          onChange={(e) =>
            onChange({ status: (e.target.value || undefined) as ShiftSessionStatus | undefined })
          }
        >
          <option value="">{labels.allStatuses}</option>
          <option value={ShiftSessionStatus.CLOSED}>{labels.closed}</option>
          <option value={ShiftSessionStatus.OPEN}>{labels.open}</option>
        </select>
      </Field>

      <label
        className={cn(
          'flex cursor-pointer items-center gap-2 text-[13px] text-ink-600',
          stacked ? '' : 'h-10'
        )}
      >
        <input
          type="checkbox"
          className="h-4 w-4 accent-amber-600"
          checked={filters.varianceOnly}
          onChange={(e) => onChange({ varianceOnly: e.target.checked })}
        />
        {labels.varianceOnly}
      </label>

      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X size={14} />
          {labels.clear}
        </Button>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  stacked,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  stacked: boolean;
  wide?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex flex-col gap-1',
        stacked ? 'w-full' : wide ? '' : 'min-w-32 flex-1 sm:flex-none'
      )}
    >
      {label && <span className="text-[12px] text-ink-500">{label}</span>}
      {children}
    </label>
  );
}

/** Opens the mobile sheet, showing how many filters are narrowing the list. */
export function FilterButton({
  count,
  onClick,
  label,
}: {
  count: number;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-paper px-3 py-1.5 text-[13px] font-medium text-ink-700"
    >
      <SlidersHorizontal size={14} />
      {label}
      {count > 0 && (
        <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-semibold text-white tabular-nums">
          {count}
        </span>
      )}
    </button>
  );
}
