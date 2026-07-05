'use client';

import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { ReactNode, useState } from 'react';
import { idbStorage } from '@/common/offline/storage/idbStorage';

// Only these query caches are persisted to IndexedDB for offline use.
// Extend this list as more pages gain offline support.
const OFFLINE_QUERY_KEYS = [
  'client-inventory',
  'client-inventory-products',
  'client-inventory-categories',
];

// Bump to invalidate all persisted caches after a breaking data-shape change.
const PERSIST_BUSTER = 'v1';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 60 * 24, // keep cached data long enough to be worth persisting
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: idbStorage,
      key: 'offline-query-cache',
    })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // discard persisted cache older than 24h
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const rootKey = query.queryKey[0];
            const whitelisted = typeof rootKey === 'string' && OFFLINE_QUERY_KEYS.includes(rootKey);
            // Still honor the default rule (only persist successful queries).
            return whitelisted && defaultShouldDehydrateQuery(query);
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
