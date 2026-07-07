'use client';

import { Pill, ShoppingBag, ShoppingBasket, Store, UtensilsCrossed, Warehouse } from 'lucide-react';
import { useI18n } from '@/providers';
import { Reveal } from '@/common/components';

const ICONS = [Store, ShoppingBasket, Warehouse, UtensilsCrossed, Pill, ShoppingBag];

export function BuiltForSection() {
  const { t } = useI18n();
  const builtFor = t.landing.builtFor;

  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl text-ink-900 sm:text-4xl">{builtFor.title}</h2>
          <p className="mt-4 text-base text-ink-500">{builtFor.subtitle}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {builtFor.items.map((label, i) => {
            const Icon = ICONS[i];
            return (
              <Reveal key={label} delay={i * 70}>
                <div className="flex h-full flex-col items-center gap-3 rounded-xl border border-border bg-paper p-5 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand-100 text-ink-700">
                    <Icon size={20} />
                  </span>
                  <span className="text-sm font-medium text-ink-900">{label}</span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
