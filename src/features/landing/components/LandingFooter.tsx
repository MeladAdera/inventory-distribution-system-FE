'use client';

import Link from 'next/link';
import { Boxes } from 'lucide-react';
import { useI18n } from '@/providers';

export function LandingFooter() {
  const { t } = useI18n();
  const footer = t.landing.footer;

  const links = [
    { href: '#features', label: footer.links.features },
    { href: '#how-it-works', label: footer.links.howItWorks },
    { href: '#showcase', label: footer.links.showcase },
    { href: '/login', label: footer.links.login },
  ];

  return (
    <footer className="border-t border-border bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-amber-500">
              <Boxes size={18} />
            </span>
            <span className="font-serif text-lg font-medium text-ink-900">{t.landing.brand}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">{footer.tagline}</p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            {footer.product}
          </h3>
          <ul className="mt-3 space-y-2">
            {links.map((link) =>
              link.href.startsWith('#') ? (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-ink-500 hover:text-ink-900">
                    {link.label}
                  </a>
                </li>
              ) : (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-500 hover:text-ink-900">
                    {link.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-5 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} {t.landing.brand} — {footer.rights}
      </div>
    </footer>
  );
}
