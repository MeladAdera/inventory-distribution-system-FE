'use client';

import { useState } from 'react';
import { Bell, Boxes, LayoutDashboard, LineChart, PieChart, ShoppingCart } from 'lucide-react';
import { useI18n } from '@/providers';
import { Reveal } from '@/common/components';

const TAB_ICONS = [LayoutDashboard, Boxes, ShoppingCart, PieChart, LineChart, Bell];

/** Abstract skeleton previews — one visual style per tab, no real data to maintain. */
function MockPanel({ variant }: { variant: number }) {
  return (
    <div className="rounded-xl border border-border bg-page p-5">
      {/* header strip shared by all variants */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-3 w-28 rounded bg-ink-200" />
        <div className="h-7 w-20 rounded-md bg-ink-900" />
      </div>

      {variant === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-paper p-3">
                <div className="h-2 w-12 rounded bg-sand-200" />
                <div
                  className={`mt-2 h-4 w-16 rounded ${i === 2 ? 'bg-amber-500' : 'bg-ink-200'}`}
                />
              </div>
            ))}
          </div>
          <div className="flex h-28 items-end gap-2 rounded-lg border border-border bg-paper p-3">
            {[35, 55, 45, 70, 52, 88, 64, 76].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-amber-500' : 'bg-ink-200'}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {variant === 1 && (
        <div className="space-y-2">
          {[70, 45, 20, 85, 60].map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-paper px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-sand-200" />
                <div className="h-2.5 w-24 rounded bg-ink-200" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-sand-200">
                  <div
                    className={`h-full rounded-full ${w < 30 ? 'bg-amber-500' : 'bg-success-700'}`}
                    style={{ width: `${w}%` }}
                  />
                </div>
                <div
                  className={`h-4 w-10 rounded-full ${w < 30 ? 'bg-amber-100' : 'bg-success-100'}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 2 && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border bg-paper px-3 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-14 rounded bg-ink-200" />
                <div className="h-2 w-24 rounded bg-sand-200" />
              </div>
              <div
                className={`h-4 w-14 rounded-full ${
                  i === 0 ? 'bg-info-100' : i === 1 ? 'bg-warning-100' : 'bg-success-100'
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {variant === 3 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 rounded-lg border border-border bg-paper p-3">
            <svg viewBox="0 0 200 80" className="h-28 w-full" preserveAspectRatio="none">
              <polyline
                points="0,65 30,55 60,58 90,40 120,45 150,22 180,28 200,12"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <polyline
                points="0,72 30,68 60,70 90,60 120,63 150,50 180,55 200,45"
                fill="none"
                stroke="#C8D0DA"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-paper p-3">
                <div className="h-2 w-10 rounded bg-sand-200" />
                <div
                  className={`mt-2 h-3.5 w-14 rounded ${i === 0 ? 'bg-amber-500' : 'bg-ink-200'}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === 4 && (
        <div className="space-y-3">
          {[
            { w: 90, hot: true },
            { w: 72, hot: false },
            { w: 55, hot: false },
            { w: 38, hot: false },
            { w: 22, hot: false },
          ].map((bar, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2.5 w-16 shrink-0 rounded bg-sand-200" />
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-paper">
                <div
                  className={`h-full rounded-full ${bar.hot ? 'bg-amber-500' : 'bg-ink-200'}`}
                  style={{ width: `${bar.w}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 5 && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-paper px-3 py-2.5"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-sand-100 text-ink-400'
                }`}
              >
                <Bell size={14} />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-32 rounded bg-ink-200" />
                <div className="h-2 w-48 max-w-full rounded bg-sand-200" />
              </div>
              {i === 0 && <div className="h-2 w-2 rounded-full bg-amber-500" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ShowcaseSection() {
  const { t } = useI18n();
  const showcase = t.landing.showcase;
  const [active, setActive] = useState(0);
  const activeTab = showcase.tabs[active];

  return (
    <section id="showcase" className="scroll-mt-24 bg-paper py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl text-ink-900 sm:text-4xl">{showcase.title}</h2>
          <p className="mt-4 text-base text-ink-500">{showcase.subtitle}</p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {showcase.tabs.map((tab, i) => {
              const Icon = TAB_ICONS[i];
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active === i
                      ? 'bg-ink-900 text-white shadow-md'
                      : 'border border-border bg-page text-ink-500 hover:text-ink-900'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            <div key={active} className="animate-pop-in">
              <MockPanel variant={active} />
              <div className="mt-6 text-center">
                <h3 className="font-serif text-xl text-ink-900">{activeTab.title}</h3>
                <p className="mt-2 text-sm text-ink-500">{activeTab.description}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
