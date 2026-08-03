'use client';

import { useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { cn } from '@/common/utils/cn';

function fmt(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * One end of the range. Borderless, because the pill around both ends carries
 * the border — two nested outlines read as two separate controls.
 */
function Endpoint({
  value,
  onChange,
  placeholder,
  locale,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  locale: 'ar' | 'en';
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => ref.current?.showPicker()}
      className={cn(
        'relative px-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
        value ? 'text-amber-700' : 'text-ink-500 hover:text-ink-800'
      )}
    >
      {value ? fmt(value, locale) : placeholder}
      {/*
        The native picker anchors to this input's border box, so it has to sit
        exactly under the button rather than being hidden — see DatePickerButton
        for the same trick and why `sr-only` doesn't work here.
      */}
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
      />
    </button>
  );
}

interface DateRangeChipProps {
  fromDate: string;
  toDate: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onClear: () => void;
  locale: 'ar' | 'en';
  labels: { from: string; to: string; clear: string };
  className?: string;
}

/**
 * A from–to date range as a single pill, with a clear button that only appears
 * once there is something to clear.
 */
export function DateRangeChip({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onClear,
  locale,
  labels,
  className,
}: DateRangeChipProps) {
  const active = fromDate !== '' || toDate !== '';

  return (
    <div
      className={cn(
        'flex items-center gap-1 h-9 px-2.5 rounded-lg border bg-paper shrink-0',
        active ? 'border-amber-400 bg-amber-50' : 'border-border',
        className
      )}
    >
      <Calendar size={14} className={cn('shrink-0', active ? 'text-amber-600' : 'text-ink-400')} />
      <Endpoint
        value={fromDate}
        onChange={onFromChange}
        placeholder={labels.from}
        locale={locale}
      />
      <span className="text-ink-300 text-xs">–</span>
      <Endpoint value={toDate} onChange={onToChange} placeholder={labels.to} locale={locale} />
      {active && (
        <button
          type="button"
          onClick={onClear}
          aria-label={labels.clear}
          className="p-0.5 rounded text-ink-400 hover:text-ink-800 transition-colors cursor-pointer shrink-0"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
