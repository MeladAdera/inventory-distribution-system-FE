'use client';

import {
  Bell,
  Boxes,
  Building2,
  PieChart,
  ShoppingCart,
  Users,
  Warehouse,
  WifiOff,
} from 'lucide-react';
import { useI18n } from '@/providers';
import { Reveal } from '@/common/components';

const ICONS = [Boxes, Building2, ShoppingCart, PieChart, Bell, Users, Warehouse, WifiOff];

export function FeaturesSection() {
  const { t } = useI18n();
  const features = t.landing.features;

  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl text-ink-900 sm:text-4xl">{features.title}</h2>
          <p className="mt-4 text-base text-ink-500">{features.subtitle}</p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <Reveal key={item.title} delay={(i % 4) * 80}>
                <div className="group h-full rounded-xl border border-border bg-paper p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-md">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sand-100 text-ink-700 transition-colors group-hover:bg-amber-100 group-hover:text-amber-700">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-ink-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
