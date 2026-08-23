'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/common/utils/cn';

export const SHIFT_TABS = ['schedule', 'history', 'report'] as const;
export type ShiftTab = (typeof SHIFT_TABS)[number];

function isShiftTab(value: string | null): value is ShiftTab {
  return value !== null && (SHIFT_TABS as readonly string[]).includes(value);
}

/**
 * Which tab is showing, held in the URL rather than component state.
 *
 * That makes a tab linkable, survivable across a reload, and reachable with the
 * back button — the same reasons the filters that follow it are headed the same
 * way. An unknown or missing `?tab=` falls back to the schedule.
 */
export function useShiftTab(): [ShiftTab, (tab: ShiftTab) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get('tab');
  const tab: ShiftTab = isShiftTab(raw) ? raw : 'schedule';

  const setTab = useCallback(
    (next: ShiftTab) => {
      const search = new URLSearchParams(params.toString());
      search.set('tab', next);
      // `scroll: false` keeps the reader where they were; switching tabs is not
      // a navigation to a new page.
      router.replace(`${pathname}?${search.toString()}`, { scroll: false });
    },
    [params, pathname, router]
  );

  return [tab, setTab];
}

interface ShiftTabsProps {
  tab: ShiftTab;
  onChange: (tab: ShiftTab) => void;
  labels: Record<ShiftTab, string>;
}

export function ShiftTabs({ tab, onChange, labels }: ShiftTabsProps) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-border">
      {SHIFT_TABS.map((id) => {
        const active = id === tab;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              '-mb-px border-b-2 pb-2.5 text-[14px] font-semibold transition-colors',
              active
                ? 'border-amber-600 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            )}
          >
            {labels[id]}
          </button>
        );
      })}
    </div>
  );
}
