'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Reads a one-shot deep-link query param — `?order=4` from a notification, say —
 * and hands back a `clear` that strips just that key.
 *
 * Clearing matters: without it the URL still says `?order=4` after the modal is
 * closed, so clicking the same notification again is a no-op navigation and
 * nothing reopens.
 *
 * Pages that call this must sit under a <Suspense> boundary — `useSearchParams`
 * opts the route out of static rendering otherwise.
 */
export function useDeepLinkParam(key: string) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const value = params.get(key);

  const clear = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [key, params, pathname, router]);

  return { value, clear };
}
