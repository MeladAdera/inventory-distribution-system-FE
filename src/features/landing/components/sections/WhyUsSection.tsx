'use client';

import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/providers';
import { CountUp, Reveal } from '@/common/components';

export function WhyUsSection() {
  const { t } = useI18n();
  const why = t.landing.why;

  return (
    <section className="bg-ink-900 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl text-white sm:text-4xl">{why.title}</h2>
          <p className="mt-4 text-base text-ink-200">{why.subtitle}</p>
        </Reveal>

        {/* stat counters */}
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {why.stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 120}>
              <div className="rounded-xl border border-ink-700 bg-ink-800 p-6 text-center">
                <div className="font-serif text-4xl text-amber-500 sm:text-5xl">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-2 text-sm text-ink-200">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {why.items.map((item, i) => (
            <Reveal key={item.title} delay={i * 60}>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-200">{item.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
