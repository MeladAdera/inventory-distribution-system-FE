'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/providers';
import { Reveal } from '@/common/components';

export function FinalCtaSection() {
  const { t } = useI18n();
  const cta = t.landing.cta;

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* subtle glow */}
          <div
            className="pointer-events-none absolute -top-24 inset-s-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500 opacity-15 blur-3xl rtl:translate-x-1/2"
            aria-hidden
          />
          <h2 className="relative font-serif text-3xl text-white sm:text-4xl">{cta.title}</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-base text-ink-200">{cta.subtitle}</p>
          <Link
            href="/login"
            className="group relative mt-8 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-8 py-3.5 text-sm font-semibold text-ink-900 shadow-lg transition-all hover:bg-amber-600 hover:shadow-xl"
          >
            {cta.button}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
