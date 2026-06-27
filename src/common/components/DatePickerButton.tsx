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
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors select-none cursor-pointer',
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
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
    </button>
  );
}
