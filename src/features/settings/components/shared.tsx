'use client';

import { Pencil } from 'lucide-react';
import { cn } from '@/common/utils/cn';

// ── Input class helper ─────────────────────────────────────────────────────

export function inputCls(hasError: boolean) {
  return cn(
    'w-full h-10 px-3 bg-paper border rounded-lg text-sm text-ink-900',
    'focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-50 transition-colors',
    hasError ? 'border-danger-700' : 'border-border'
  );
}

// ── Card header ────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title: string;
  subtitle: string;
  editLabel: string;
  editing: boolean;
  onEdit: () => void;
}

export function CardHeader({ title, subtitle, editLabel, editing, onEdit }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
      <div>
        <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
        <p className="text-[13px] text-ink-500 mt-0.5">{subtitle}</p>
      </div>
      {!editing && (
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors shrink-0"
        >
          <Pencil size={13} />
          {editLabel}
        </button>
      )}
    </div>
  );
}

// ── Card footer (save / cancel) ────────────────────────────────────────────

interface CardFooterProps {
  saveLabel: string;
  cancelLabel: string;
  isSaving: boolean;
  onCancel: () => void;
}

export function CardFooter({ saveLabel, cancelLabel, isSaving, onCancel }: CardFooterProps) {
  return (
    <div className="flex items-center gap-2.5 px-6 py-4 border-t border-border bg-sand-100/50">
      <button
        type="submit"
        disabled={isSaving}
        className="h-9 px-5 bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-60 disabled:pointer-events-none"
      >
        {isSaving ? '...' : saveLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="h-9 px-4 border border-border rounded-lg text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
      >
        {cancelLabel}
      </button>
    </div>
  );
}

// ── Info row (read-only) ───────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  last?: boolean;
}

export function InfoRow({ label, value, icon, last }: InfoRowProps) {
  return (
    <div className={cn('flex items-center gap-4 px-6 py-4', !last && 'border-b border-border')}>
      <div className="w-32 shrink-0 flex items-center gap-1.5">
        {icon}
        <span className="text-[13px] text-ink-500">{label}</span>
      </div>
      <span className="text-[13px] font-medium text-ink-900 flex-1">{value}</span>
    </div>
  );
}

// ── Field row (edit mode) ──────────────────────────────────────────────────

interface FieldRowProps {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  last?: boolean;
  children: React.ReactNode;
}

export function FieldRow({ label, icon, error, last, children }: FieldRowProps) {
  return (
    <div className={cn('flex items-start gap-4 px-6 py-4', !last && 'border-b border-border')}>
      <div className="w-32 shrink-0 flex items-center gap-1.5 pt-2.5">
        {icon}
        <span className="text-[13px] text-ink-500">{label}</span>
      </div>
      <div className="flex-1">
        {children}
        {error && <p className="text-xs text-danger-700 mt-1">{error}</p>}
      </div>
    </div>
  );
}

// ── Skeleton primitives ────────────────────────────────────────────────────

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border">
      <div className="w-32 h-3 rounded skeleton-shimmer shrink-0" />
      <div className="h-3 w-48 rounded skeleton-shimmer flex-1" />
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className="flex items-center gap-4 px-6 py-5 bg-sand-100 border-b border-border">
      <div className="w-14 h-14 rounded-xl skeleton-shimmer shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 w-40 rounded skeleton-shimmer" />
        <div className="h-3 w-24 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}
