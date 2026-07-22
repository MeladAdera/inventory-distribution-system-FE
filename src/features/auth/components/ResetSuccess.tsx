'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { ROUTES } from '@/common/constants/app.constants';

/**
 * Step three: the reset succeeded. Every prior session was invalidated backend-side,
 * so the only way forward is a fresh sign-in with the new password.
 */
export function ResetSuccess() {
  const { t } = useI18n();
  const p = t.auth.forgot.done;

  return (
    <div className="text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 size={26} />
      </span>

      <Link
        href={ROUTES.LOGIN}
        className="mt-2 flex w-full items-center justify-center rounded-lg bg-ink-900 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-ink-700 hover:shadow-lg"
      >
        {p.submit}
      </Link>
    </div>
  );
}
