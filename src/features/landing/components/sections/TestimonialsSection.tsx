'use client';

import { Quote } from 'lucide-react';
import { useI18n } from '@/providers';
import { Reveal } from '@/common/components';

export function TestimonialsSection() {
  const { t } = useI18n();
  const testimonials = t.landing.testimonials;

  return (
    <section className="bg-paper py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl text-ink-900 sm:text-4xl">{testimonials.title}</h2>
          <p className="mt-4 text-base text-ink-500">{testimonials.subtitle}</p>
        </Reveal>

        {/* placeholder cards — swapped for real quotes once customers share them */}
        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="flex h-full flex-col rounded-xl border border-dashed border-ink-200 bg-page p-6">
                <Quote size={22} className="text-amber-500/60" />
                <div className="mt-4 space-y-2">
                  <div className="h-2.5 w-full rounded bg-sand-200" />
                  <div className="h-2.5 w-5/6 rounded bg-sand-200" />
                  <div className="h-2.5 w-2/3 rounded bg-sand-200" />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-sand-200" />
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-24 rounded bg-sand-200" />
                    <div className="h-2 w-16 rounded bg-sand-100" />
                  </div>
                </div>
                <p className="mt-5 text-center text-xs italic text-ink-400">
                  {testimonials.placeholder}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
