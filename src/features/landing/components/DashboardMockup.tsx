'use client';

import { Bell, Boxes, DollarSign, PackageCheck, Receipt, TrendingDown } from 'lucide-react';
import { useI18n } from '@/providers';

const CHART_BARS = [42, 65, 50, 80, 58, 92, 74];

/** Stylized, hand-built preview of the app dashboard used in the hero. */
export function DashboardMockup() {
  const { t } = useI18n();
  const mock = t.landing.hero.mock;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-border bg-paper shadow-[0_24px_64px_rgba(14,27,44,0.18)]">
        {/* window chrome */}
        <div className="flex items-center gap-1.5 border-b border-border bg-sand-100 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
          <span className="ms-3 text-xs font-medium text-ink-500">{mock.title}</span>
        </div>

        <div className="flex">
          {/* mini sidebar */}
          <div className="hidden w-12 flex-col items-center gap-4 border-e border-border bg-page py-4 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 text-amber-500">
              <Boxes size={14} />
            </span>
            {[Receipt, PackageCheck, Bell].map((Icon, i) => (
              <span key={i} className="text-ink-400">
                <Icon size={14} />
              </span>
            ))}
          </div>

          <div className="flex-1 space-y-4 p-4 sm:p-5">
            {/* stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-page p-3">
                <div className="flex items-center gap-1 text-[10px] text-ink-500">
                  <DollarSign size={10} /> {mock.revenue}
                </div>
                <div className="mt-1 font-serif text-base font-medium text-ink-900 sm:text-lg">
                  {mock.revenueValue}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-page p-3">
                <div className="flex items-center gap-1 text-[10px] text-ink-500">
                  <Boxes size={10} /> {mock.products}
                </div>
                <div className="mt-1 font-serif text-base font-medium text-ink-900 sm:text-lg">
                  {mock.productsValue}
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-3">
                <div className="flex items-center gap-1 text-[10px] text-amber-700">
                  <TrendingDown size={10} /> {mock.alerts}
                </div>
                <div className="mt-1 font-serif text-base font-medium text-amber-700 sm:text-lg">
                  {mock.alertsValue}
                </div>
              </div>
            </div>

            {/* bar chart */}
            <div className="rounded-lg border border-border bg-page p-3">
              <div className="mb-2 text-[10px] font-medium text-ink-500">{mock.chartTitle}</div>
              <div className="flex h-20 items-end gap-2">
                {CHART_BARS.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${i === 5 ? 'bg-amber-500' : 'bg-ink-200'}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* activity feed */}
            <div className="rounded-lg border border-border bg-page p-3">
              <div className="mb-2 text-[10px] font-medium text-ink-500">{mock.activityTitle}</div>
              <ul className="space-y-2">
                {[mock.activity1, mock.activity2, mock.activity3].map((line, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-ink-700">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        i === 2 ? 'bg-amber-500' : 'bg-success-700'
                      }`}
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* floating low-stock alert */}
      <div className="absolute -bottom-5 -inset-s-4 hidden items-center gap-2 rounded-xl border border-border bg-paper px-3 py-2 shadow-lg sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Bell size={15} />
        </span>
        <div>
          <div className="text-[11px] font-medium text-ink-900">{mock.alerts}</div>
          <div className="text-[10px] text-ink-500">{mock.activity3}</div>
        </div>
      </div>
    </div>
  );
}
