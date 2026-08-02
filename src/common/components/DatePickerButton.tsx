'use client';

import { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/common/utils/cn';

function fmtShort(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

interface DatePickerButtonProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  locale: 'ar' | 'en';
  className?: string;
}

export function DatePickerButton({
  value,
  onChange,
  placeholder,
  locale,
  className,
}: DatePickerButtonProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => ref.current?.showPicker()}
      className={cn(
        'relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors select-none cursor-pointer',
        value
          ? 'border-amber-400 bg-amber-50 text-amber-700'
          : 'border-border bg-paper text-ink-500 hover:border-ink-300',
        className
      )}
    >
      <Calendar className="h-4 w-4 shrink-0" />
      <span className="text-xs font-medium truncate">
        {value ? fmtShort(value, locale) : placeholder}
      </span>
      {/*
        The native picker anchors to this input's border box, so the input has to
        sit exactly under the button. `sr-only` clips it to a 1px box that the
        browser can't anchor to, which drops the calendar at the foot of the page
        — hence a full-size transparent overlay instead of hiding it.

        Kept out of the tab order and the a11y tree: the button already carries
        the visible label, and clicks are forwarded here via showPicker().
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
