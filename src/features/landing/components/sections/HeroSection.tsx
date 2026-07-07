'use client';

import Link from 'next/link';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import { useI18n } from '@/providers';
import { Reveal } from '@/common/components';
import { DashboardMockup } from '../DashboardMockup';

export function HeroSection() {
  const { t } = useI18n();
  const hero = t.landing.hero;

  return (
    <section className="relative overflow-hidden">
      {/* soft background glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 inset-s-1/4/4 h-96 w-96 rounded-full bg-amber-100 opacity-50 blur-3xl" />
        <div className="absolute top-40 inset-e-0 h-80 w-80 rounded-full bg-sand-200 opacity-60 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-2 lg:pt-24">
        <Reveal>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              <Sparkles size={12} />
              {hero.badge}
            </span>

            <h1 className="mt-5 font-serif text-4xl leading-tight text-ink-900 sm:text-5xl lg:text-[3.4rem]">
              {hero.title1}
              <br />
              {hero.title2}
              <br />
              <span className="text-amber-600">{hero.title3}</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg">
              {hero.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-lg bg-ink-900 px-6 py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-ink-700 hover:shadow-lg"
              >
                {hero.ctaPrimary}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                />
              </Link>
              <a
                href="#showcase"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-paper px-6 py-3 text-sm font-medium text-ink-700 transition-all hover:border-ink-200 hover:shadow-sm"
              >
                <PlayCircle size={16} className="text-amber-600" />
                {hero.ctaSecondary}
              </a>
            </div>

            <p className="mt-4 text-xs text-ink-400">{hero.note}</p>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <DashboardMockup />
        </Reveal>
      </div>
    </section>
  );
}
