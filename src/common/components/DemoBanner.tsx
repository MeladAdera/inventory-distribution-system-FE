'use client';

import { IS_DEMO } from '@/common/constants/demo.constants';
import { useI18n } from '@/providers/I18nProvider';

/**
 * Fixed rather than in the page flow: the app shells are `h-screen`, so a bar
 * above them would push the bottom of every page off screen. Clicks pass through
 * so it can never cover a control. z-105 sits above the top bars (z-100) and
 * below drawers (z-110).
 */
export function DemoBanner() {
  const { t } = useI18n();

  if (!IS_DEMO) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-105 flex justify-center">
      <span className="rounded-b-lg bg-amber-500 px-3 py-0.5 text-xs font-medium text-ink-900 shadow-sm">
        {t.auth.login.demo.banner}
      </span>
    </div>
  );
}
