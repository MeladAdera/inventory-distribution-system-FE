'use client';

import { Calculator, ClipboardList, Files, HelpCircle, PackageX, Store } from 'lucide-react';
import { useI18n } from '@/providers';
import { Reveal } from '@/common/components';

const ICONS = [PackageX, ClipboardList, Calculator, HelpCircle, Store, Files];

export function ProblemsSection() {
  const { t } = useI18n();
  const problems = t.landing.problems;

  return (
    <section id="problems" className="scroll-mt-24 bg-paper py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl text-ink-900 sm:text-4xl">{problems.title}</h2>
          <p className="mt-4 text-base text-ink-500">{problems.subtitle}</p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {problems.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <Reveal key={item.title} delay={i * 80}>
                <div className="h-full rounded-xl border border-border bg-page p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-700">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink-900">{item.title}</h3>
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
