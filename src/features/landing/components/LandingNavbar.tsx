'use client';

import Link from 'next/link';
import { Boxes } from 'lucide-react';
import { useI18n } from '@/providers';

export function LandingNavbar() {
  const { t, locale, setLocale } = useI18n();
  const nav = t.landing.nav;

  const links = [
    { href: '#problems', label: nav.problems },
    { href: '#how-it-works', label: nav.howItWorks },
    { href: '#features', label: nav.features },
    { href: '#showcase', label: nav.showcase },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-page/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-amber-500">
            <Boxes size={18} />
          </span>
          <span className="font-serif text-lg font-medium text-ink-900">{t.landing.brand}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-ink-500 transition-colors hover:text-ink-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="rounded-md px-2 py-1.5 text-sm text-ink-500 transition-colors hover:bg-sand-100 hover:text-ink-900"
          >
            {locale === 'ar' ? 'EN' : 'ع'}
          </button>
          <Link
            href="/login"
            className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-sand-100 sm:block"
          >
            {nav.login}
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-ink-700 hover:shadow-md"
          >
            {nav.getStarted}
          </Link>
        </div>
      </div>
    </header>
  );
}
