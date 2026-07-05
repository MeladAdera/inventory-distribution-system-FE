import type { Metadata, Viewport } from 'next';
import { Providers } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inventory Distribution System',
  description: 'Manage inventory and orders efficiently',
  // iOS Safari doesn't fully honor the web manifest — these give it the installable app feel.
  appleWebApp: {
    capable: true,
    title: 'Inventory',
    statusBarStyle: 'default',
  },
  icons: {
    // Reuses the PWA app icon as the browser tab favicon — one icon, one identity.
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1612',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
