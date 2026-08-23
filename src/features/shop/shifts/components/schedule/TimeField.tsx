'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { buildTimeOptions, parseTimeInput, toPickerValue } from '../../utils/time.utils';

interface TimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}

/**
 * A typeable time field with a dropdown of common times.
 *
 * Not an `<input type="time">`: that maxes out at 23:59, so the API's end-of-day
 * `"24:00"` is unrepresentable there and would silently round to midnight,
 * turning a full trading day into a zero-length one. A plain text input plus a
 * `<datalist>` gives both halves — type `830` or `18` straight in, or pick from
 * the list — and can hold 24:00 like any other value.
 *
 * What is typed is normalised on blur, so `8`, `830`, `08.30` and `٠٨:٣٠` all
 * land as a value the API accepts. Anything unreadable reverts to the last good
 * value rather than being written through.
 */
export function TimeField({ value, onChange, disabled = false, ariaLabel }: TimeFieldProps) {
  const listId = useId();
  const options = useMemo(buildTimeOptions, []);
  const canonical = toPickerValue(value);

  // Local draft so typing is never fought by the parent's value mid-keystroke.
  const [draft, setDraft] = useState(canonical);

  useEffect(() => {
    setDraft(canonical);
  }, [canonical]);

  function commit() {
    const parsed = parseTimeInput(draft);
    if (parsed === null) {
      setDraft(canonical); // unreadable — put the last good value back
      return;
    }
    setDraft(parsed);
    if (parsed !== canonical) onChange(parsed);
  }

  return (
    <>
      <input
        type="text"
        list={listId}
        className="input w-full text-[16px] tabular-nums disabled:opacity-55"
        inputMode="numeric"
        autoComplete="off"
        dir="ltr"
        maxLength={8}
        disabled={disabled}
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}
