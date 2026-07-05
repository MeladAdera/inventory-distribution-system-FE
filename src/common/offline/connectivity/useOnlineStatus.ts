'use client';

import { useSyncExternalStore } from 'react';

// Shared connectivity state. `navigator.onLine` alone is unreliable (it reports
// "online" for a connected-but-dead network), so we combine it with a periodic
// probe that actually reaches the API.
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
const listeners = new Set<() => void>();
let monitorStarted = false;

function emit() {
  listeners.forEach((l) => l());
}

function setOnline(next: boolean) {
  if (next !== isOnline) {
    isOnline = next;
    emit();
  }
}

// No dedicated /health endpoint exists yet (flagged to backend as a follow-up),
// so probe a cheap read. Any HTTP response — including 401 — proves the server
// is reachable; only a thrown fetch (network failure/timeout) means offline.
async function probe(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    await fetch(`${base}/inventory?limit=1`, {
      method: 'GET',
      signal: controller.signal,
      credentials: 'include',
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Called once by OfflineSyncProvider. Idempotent.
export function startConnectivityMonitor(): () => void {
  if (monitorStarted || typeof window === 'undefined') return () => {};
  monitorStarted = true;

  const onBrowserOnline = () => {
    // Confirm with a real probe before declaring us back online.
    void probe().then(setOnline);
  };
  const onBrowserOffline = () => setOnline(false);

  window.addEventListener('online', onBrowserOnline);
  window.addEventListener('offline', onBrowserOffline);

  // Periodic probe catches the connected-but-dead-network case the events miss.
  const interval = window.setInterval(() => {
    void probe().then(setOnline);
  }, 20000);

  // Initial confirmation.
  void probe().then(setOnline);

  return () => {
    window.removeEventListener('online', onBrowserOnline);
    window.removeEventListener('offline', onBrowserOffline);
    window.clearInterval(interval);
    monitorStarted = false;
  };
}

export function getIsOnline(): boolean {
  return isOnline;
}

// Lets non-React code (the provider) react to connectivity transitions.
export function subscribeOnline(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (cb) => subscribeOnline(cb),
    () => isOnline,
    () => true // SSR: assume online to avoid a flash of "offline"
  );
}
