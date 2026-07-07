'use client';

import { Boxes, ChevronRight, LineChart, RefreshCw, ShoppingCart, Truck } from 'lucide-react';
import { useI18n } from '@/providers';
import { Reveal } from '@/common/components';

const ICONS = [Truck, Boxes, ShoppingCart, RefreshCw, LineChart];

export function HowItWorksSection() {
  const { t } = useI18n();
  const how = t.landing.how;

  return (
    <section id="how-it-works" className="scroll-mt-24 bg-paper py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl text-ink-900 sm:text-4xl">{how.title}</h2>
          <p className="mt-4 text-base text-ink-500">{how.subtitle}</p>
        </Reveal>

        <div className="mt-14 flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
          {how.steps.map((step, i) => {
            const Icon = ICONS[i];
            return (
              <div key={step.title} className="flex flex-1 flex-col items-center gap-2 lg:flex-row">
                <Reveal delay={i * 120} className="w-full flex-1">
                  <div className="flex h-full flex-col items-center rounded-xl border border-border bg-page p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-amber-500">
                      <Icon size={19} />
                      <span className="absolute -top-1.5 -inset-e-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-ink-900">
                        {i + 1}
                      </span>
                    </span>
                    <h3 className="mt-3 text-sm font-semibold text-ink-900">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{step.description}</p>
                  </div>
                </Reveal>
                {i < how.steps.length - 1 && (
                  <ChevronRight
                    size={20}
                    className="shrink-0 rotate-90 text-amber-600 lg:rotate-0 rtl:lg:rotate-180"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
