'use client';

import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatDuration, toPickerValue } from '../../utils/time.utils';
import type { ShiftTemplate } from '../../types/shifts.types';

/** Avatars beyond this collapse into a "+N" chip. */
const VISIBLE_ASSIGNEES = 3;

interface SlotCardProps {
  template: ShiftTemplate;
  onEdit: () => void;
  onAssign: () => void;
  onRemove: () => void;
  labels: {
    unassigned: string;
    edit: string;
    remove: string;
    assign: string;
    more: string;
  };
}

export function SlotCard({ template, onEdit, onAssign, onRemove, labels }: SlotCardProps) {
  const visible = template.assignees.slice(0, VISIBLE_ASSIGNEES);
  const overflow = template.assignees.length - visible.length;

  return (
    <div className="rounded-lg border border-border bg-paper p-2.5">
      <div className="flex items-start justify-between gap-1">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-800">
          {template.name}
        </p>
        <div className="flex shrink-0 gap-0.5">
          <IconButton onClick={onEdit} label={labels.edit}>
            <Pencil size={13} />
          </IconButton>
          <IconButton onClick={onRemove} label={labels.remove} danger>
            <Trash2 size={13} />
          </IconButton>
        </div>
      </div>

      <p className="mt-0.5 text-[12px] tabular-nums text-ink-500">
        {toPickerValue(template.start_time)} – {toPickerValue(template.end_time)}
      </p>
      {/* Server-computed. Never derived here: a 22:00 → 02:00 slot is 240
          minutes, and subtracting the two would give −1200. */}
      <p className="text-[11px] text-ink-400">{formatDuration(template.duration_minutes)}</p>

      <button
        type="button"
        onClick={onAssign}
        title={labels.assign}
        className="mt-2 flex w-full items-center gap-1 rounded-md px-1 py-1 transition-colors hover:bg-sand-100"
      >
        {template.assignees.length === 0 ? (
          <span className="flex items-center gap-1 text-[11px] text-ink-400">
            <UserPlus size={12} />
            {labels.unassigned}
          </span>
        ) : (
          <>
            {visible.map((a) => (
              <span
                key={a.id}
                title={a.name}
                className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700"
              >
                {a.name.slice(0, 1).toUpperCase()}
              </span>
            ))}
            {overflow > 0 && (
              <span className="text-[11px] text-ink-400">
                {labels.more.replace('{count}', String(overflow))}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}

function IconButton({
  onClick,
  label,
  danger = false,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'rounded p-1 transition-colors',
        danger
          ? 'text-ink-400 hover:bg-danger-100 hover:text-danger-700'
          : 'text-ink-400 hover:bg-sand-100 hover:text-ink-700'
      )}
    >
      {children}
    </button>
  );
}
