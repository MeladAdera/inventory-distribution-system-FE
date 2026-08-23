'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { ROUTES } from '@/common/constants/app.constants';
import { buttonVariants } from '@/common/components/ui/button';

interface SellShiftGateProps {
  labels: { title: string; body: string; cta: string };
}

/**
 * Stands in for the till when no shift is open.
 *
 * Selling with no shift is allowed by the API — the sale simply belongs to no
 * drawer — so this is a discipline prompt, not a lock. Whether it shows at all
 * is decided by `useOpenShift().shouldBlockSelling`, which stays false while the
 * answer is unknown so a shop that cannot reach the server is never stranded.
 */
export function SellShiftGate({ labels }: SellShiftGateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sand-100 text-ink-500">
        <Clock size={26} />
      </div>
      <h2 className="mt-4 text-[18px] font-semibold text-ink-900">{labels.title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-500">{labels.body}</p>
      <Link
        href={ROUTES.CLIENT_MY_SHIFT}
        className={buttonVariants({ size: 'lg', className: 'mt-6' })}
      >
        {labels.cta}
      </Link>
    </div>
  );
}
