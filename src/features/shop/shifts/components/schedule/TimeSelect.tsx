'use client';

import { useMemo } from 'react';
import { buildTimeOptions, toPickerValue } from '../../utils/time.utils';

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Label for the `24:00` option, which means end of day rather than midnight. */
  endOfDayLabel: string;
  ariaLabel: string;
}

/**
 * A select rather than `<input type="time">`, for one blunt reason: an HTML time
 * input cannot hold `"24:00"`. Its maximum is 23:59, so the API's end-of-day
 * value would be unrepresentable and would silently round to midnight — turning
 * a full trading day into a zero-length one.
 *
 * A select also makes the 24:00-is-not-00:00 distinction visible, and is far
 * easier to use one-handed on a phone behind a counter.
 */
export function TimeSelect({
  value,
  onChange,
  disabled = false,
  endOfDayLabel,
  ariaLabel,
}: TimeSelectProps) {
  const options = useMemo(buildTimeOptions, []);
  const current = toPickerValue(value);

  return (
    <select
      className="input w-full tabular-nums disabled:opacity-55"
      value={current}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt === '24:00' ? `24:00 — ${endOfDayLabel}` : opt}
        </option>
      ))}
    </select>
  );
}
