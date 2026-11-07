// Demo-only. This file exists on the `demo` branch and must never be merged to `main`.

export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const DEMO_PASSWORD = 'Demo@2026';

export const DEMO_ACCOUNTS = [
  { email: 'demo-admin@example.com', role: 'admin' },
  { email: 'demo-owner@example.com', role: 'owner' },
  { email: 'demo-owner2@example.com', role: 'owner2' },
  { email: 'demo-employee@example.com', role: 'employee' },
] as const;
