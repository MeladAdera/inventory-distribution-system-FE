'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { ROUTES } from '@/common/constants/app.constants';
import { useI18n } from '@/providers/I18nProvider';
import { useOpenShift } from '../hooks/useOpenShift';

/**
 * Persistent "am I clocked in?" indicator for the top bar.
 *
 * Reads the same `['shifts','open']` query as the sell gate and the my-shift
 * page, so all three always agree and the poll is shared rather than tripled.
 *
 * Renders nothing while the answer is unknown — a chip that flickered from
 * "no shift" to "on shift" on every page load would train people to ignore it.
 */
export function ShiftChip() {
  const { t } = useI18n();
  const s = t.shifts.chip;
  const { openShift, isMine, isLoading, error } = useOpenShift();

  if (isLoading || error) return null;

  const label = !openShift
    ? s.noShift
    : isMine
      ? s.onShift
      : s.otherOnShift.replace('{name}', openShift.user_name);

  return (
    <Link
      href={ROUTES.CLIENT_MY_SHIFT}
      className={cn(
        'hidden h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold transition-colors sm:flex',
        isMine
          ? 'border-transparent bg-success-100 text-success-700 hover:brightness-97'
          : 'border-border text-ink-500 hover:bg-sand-100'
      )}
      title={label}
    >
      <Clock size={14} className="shrink-0" />
      <span className="max-w-32 truncate">{label}</span>
    </Link>
  );
}
