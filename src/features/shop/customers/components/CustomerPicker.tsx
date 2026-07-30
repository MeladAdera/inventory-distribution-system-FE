'use client';

import { useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { formatMoney, isPositiveMoney } from '@/common/utils/money';
import type { Customer } from '../types/customers.types';

interface CustomerPickerProps {
  customers: Customer[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  labels: {
    label: string;
    searchPlaceholder: string;
    change: string;
    none: string;
    owes: string;
  };
}

/**
 * Inline searchable customer list.
 *
 * Rendered expanded rather than as a dropdown on purpose: this lives inside a
 * modal, where an absolutely-positioned menu fights the overlay's stacking and
 * clipping, and an always-visible list is easier to hit on a phone.
 *
 * Filtering is client-side over the list the page already loaded, so picking a
 * customer works identically offline.
 *
 * Once someone is picked the list folds into a single row naming them, which
 * frees the height the rest of the form needs and states the choice back
 * plainly — recording a debt against the wrong person is the costly mistake
 * here, and a checkmark somewhere in a scrolled list is easy to misread.
 */
export function CustomerPicker({ customers, selectedId, onSelect, labels }: CustomerPickerProps) {
  const [query, setQuery] = useState('');
  // Set when the user asks to change an existing choice — the only way back to
  // the list once it has folded.
  const [isPicking, setIsPicking] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').toLowerCase().includes(q)
    );
  }, [customers, query]);

  function handleSelect(id: number) {
    onSelect(id);
    setIsPicking(false);
    setQuery('');
  }

  if (customers.length === 0) {
    return (
      <div>
        <p className="text-[12px] font-medium text-ink-500 mb-1.5">{labels.label}</p>
        <p className="text-[13px] text-ink-400 py-3 px-3 bg-page border border-border rounded-lg">
          {labels.none}
        </p>
      </div>
    );
  }

  if (selectedCustomer && !isPicking) {
    return (
      <div>
        <p className="text-[12px] font-medium text-ink-500 mb-1.5">{labels.label}</p>

        <div className="flex items-center gap-2 px-3 py-2.5 bg-paper border border-amber-500 rounded-lg">
          <span className="w-4 h-4 rounded-full bg-amber-600 flex items-center justify-center shrink-0">
            <Check size={11} className="text-white" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-medium text-ink-900 truncate">
              {selectedCustomer.name}
            </span>
            {(selectedCustomer.phone || isPositiveMoney(selectedCustomer.total_remaining)) && (
              <span className="block text-[11px] text-ink-400">
                {selectedCustomer.phone && (
                  <span className="font-mono">{selectedCustomer.phone}</span>
                )}
                {selectedCustomer.phone &&
                  isPositiveMoney(selectedCustomer.total_remaining) &&
                  ' · '}
                {isPositiveMoney(selectedCustomer.total_remaining) && (
                  <span className="font-medium text-amber-700 tabular-nums">
                    {labels.owes.replace('{amount}', formatMoney(selectedCustomer.total_remaining))}
                  </span>
                )}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setIsPicking(true)}
            className="shrink-0 px-2 py-1 rounded text-[12px] font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
          >
            {labels.change}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] font-medium text-ink-500 mb-1.5">{labels.label}</p>

      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full h-9 ps-9 pe-3 text-[13px] text-ink-900 placeholder:text-ink-400 bg-page border border-border rounded-lg outline-none focus:border-amber-500"
        />
      </div>

      <div
        role="listbox"
        aria-label={labels.label}
        className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border"
      >
        {filtered.map((c) => {
          const selected = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => handleSelect(c.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-start transition-colors ${
                selected ? 'bg-amber-50' : 'hover:bg-sand-50'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  selected ? 'bg-amber-600 border-amber-600' : 'border-border'
                }`}
              >
                {selected && <Check size={11} className="text-white" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-medium text-ink-900 truncate">
                  {c.name}
                </span>
                {c.phone && (
                  <span className="block font-mono text-[11px] text-ink-400">{c.phone}</span>
                )}
              </span>
              {isPositiveMoney(c.total_remaining) && (
                <span className="shrink-0 text-[11px] font-medium text-amber-700 tabular-nums">
                  {labels.owes.replace('{amount}', formatMoney(c.total_remaining))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
