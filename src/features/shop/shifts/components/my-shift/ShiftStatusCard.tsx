'use client';

import { useEffect, useState } from 'react';
import { Clock, Lock, PlayCircle, Wallet } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatMoney } from '@/common/utils/money';
import { Button } from '@/common/components/ui/button';
import type { ShiftSession } from '../../types/shifts.types';

/** Re-render the elapsed counter once a minute; it is displayed to the minute. */
const TICK_MS = 60_000;

function formatElapsed(fromIso: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface ShiftStatusCardProps {
  /** The shop's open shift, or null when nobody is working. */
  session: ShiftSession | null;
  /** True when `session` belongs to the current user. */
  isMine: boolean;
  /**
   * Suppresses the off-schedule note. An owner is never on a rota, so the flag
   * is true on every owner shift and would badge each one as an exception.
   */
  isOwner: boolean;
  locale: string;
  currency: string;
  onStart: () => void;
  onClose: () => void;
  labels: {
    none: { title: string; body: string; cta: string };
    mine: {
      title: string;
      startedAt: string;
      elapsed: string;
      float: string;
      slot: string;
      noSlot: string;
      offSchedule: string;
      cta: string;
    };
    other: { title: string; body: string; cta: string };
  };
}

export function ShiftStatusCard({
  session,
  isMine,
  isOwner,
  locale,
  currency,
  onStart,
  onClose,
  labels,
}: ShiftStatusCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [session]);

  const timeFormatter = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });

  // ── Nobody is working ─────────────────────────────────────────────────────
  if (!session) {
    return (
      <Card tone="idle" icon={<PlayCircle size={26} />} title={labels.none.title}>
        <p className="text-[14px] leading-relaxed text-ink-500">{labels.none.body}</p>
        <Button size="lg" className="mt-6 w-full" onClick={onStart}>
          {labels.none.cta}
        </Button>
      </Card>
    );
  }

  // ── Someone else's shift is open ──────────────────────────────────────────
  // Never a dead end: the way forward is to count their drawer and close it.
  if (!isMine) {
    return (
      <Card
        tone="blocked"
        icon={<Lock size={26} />}
        title={labels.other.title.replace('{name}', session.user_name)}
      >
        <p className="text-[14px] leading-relaxed text-ink-500">{labels.other.body}</p>
        <Button size="lg" variant="secondary" className="mt-6 w-full" onClick={onClose}>
          {labels.other.cta}
        </Button>
      </Card>
    );
  }

  // ── My shift is running ───────────────────────────────────────────────────
  // Deliberately no expected-cash figure here: showing what the till *should*
  // hold invites typing it back in at close, which is not a count.
  return (
    <Card tone="live" icon={<Clock size={26} />} title={labels.mine.title}>
      <dl className="mt-1 divide-y divide-border">
        <Row
          label={labels.mine.slot}
          value={session.shift_template_name ?? labels.mine.noSlot}
          muted={session.shift_template_name === null}
        />
        <Row
          label={labels.mine.startedAt}
          value={timeFormatter.format(new Date(session.opened_at))}
        />
        <Row label={labels.mine.elapsed} value={formatElapsed(session.opened_at, now)} />
        <Row
          label={labels.mine.float}
          value={`${formatMoney(session.opening_float)} ${currency}`}
          icon={<Wallet size={14} className="text-ink-400" />}
        />
      </dl>

      {session.is_off_schedule && !isOwner && (
        <p className="mt-4 rounded-lg bg-sand-100 px-3 py-2 text-[12px] text-ink-500">
          {labels.mine.offSchedule}
        </p>
      )}

      <Button size="lg" variant="destructive" className="mt-6 w-full" onClick={onClose}>
        {labels.mine.cta}
      </Button>
    </Card>
  );
}

// ── Presentational shell ────────────────────────────────────────────────────

const toneStyles = {
  idle: 'bg-sand-100 text-ink-500',
  live: 'bg-success-100 text-success-700',
  blocked: 'bg-amber-100 text-amber-700',
};

function Card({
  tone,
  icon,
  title,
  children,
}: {
  tone: keyof typeof toneStyles;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-border bg-paper p-6 shadow-sm sm:p-8">
      <div
        className={cn(
          'mx-auto flex h-14 w-14 items-center justify-center rounded-full',
          toneStyles[tone]
        )}
      >
        {icon}
      </div>
      <h2 className="mt-4 text-center text-[18px] font-semibold text-ink-900">{title}</h2>
      <div className="mt-3 text-center">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
  icon,
}: {
  label: string;
  value: string;
  muted?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-start">
      <dt className="flex items-center gap-1.5 text-[13px] text-ink-500">
        {icon}
        {label}
      </dt>
      <dd
        className={cn(
          'text-[14px] font-medium tabular-nums',
          muted ? 'text-ink-400' : 'text-ink-800'
        )}
      >
        {value}
      </dd>
    </div>
  );
}
