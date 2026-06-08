'use client';

import { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';

export function Providers({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
