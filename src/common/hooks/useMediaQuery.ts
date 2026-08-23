'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Tracks a CSS media query from React.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: the effect
 * version reads the width once after mount, so it never notices a rotation or
 * a resized window, and it renders one frame at the wrong breakpoint first.
 * This subscribes to the change event and has a server snapshot for SSR.
 *
 * Use it only for behaviour that CSS cannot express — choosing which component
 * to render. Pure styling belongs in Tailwind's responsive prefixes.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // The server has no viewport; assume the wide layout and let the client
    // correct on hydration.
    () => false
  );
}

/** Below Tailwind's `md` — where the seven-column week board stops fitting. */
export const NARROW_QUERY = '(max-width: 767px)';
