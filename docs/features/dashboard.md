# Feature: Dashboard Page (FIGMA-002)

**Status**: Complete  
**Created Date**: 2026-06-11  
**Last Updated**: 2026-06-11  
**Assignee**: Melad Adera  
**Ticket**: FIGMA-002

---

## 📋 Overview

### Purpose
The dashboard is the default landing page after login (`/dashboard`). It provides a warehouse manager with an at-a-glance overview of inventory health: KPI metrics, consumption trends, top-consumed products, low-stock alerts, and recent activity.

### Business Value
- Surfaces critical information (low stock, daily/monthly usage) without navigating away
- Clickable KPI cards enable quick access to the Shortages page
- Bilingual (AR/EN) with full RTL/LTR layout support

---

## 🏗️ Architecture

### File Structure
```
src/features/dashboard/
├── components/
│   ├── KpiCard.tsx              # Reusable metric card (icon, trend, value, sub-label)
│   ├── CardShell.tsx            # Shared card container (title header + action slot)
│   ├── ConsumptionTrendChart.tsx # Area chart (daily/weekly/monthly) via recharts
│   ├── TopConsumedChart.tsx      # CSS horizontal bar chart (top 5 products)
│   ├── LowStockAlertsTable.tsx   # Mini 5-row table with replenish buttons
│   └── RecentActivityFeed.tsx    # Chronological activity list
└── mock/
    └── dashboardData.ts          # Static mock data (KPIs, chart series, shortages, activity)

src/app/(dashboard)/dashboard/page.tsx   # Page — composes all four layers
src/i18n/en/dashboard.json               # English translations
src/i18n/ar/dashboard.json               # Arabic translations
```

### Page Layout (4 layers)
```
Layer 1 — Page Header
  ├── Eyebrow label ("نظرة عامة / Overview")
  ├── Greeting heading (IBM Plex Serif, 34px)
  ├── Subtitle (warehouse + replenishment count)
  └── "نقل جديد / New Transfer" button (amber-600, stub → TransferModal)

Layer 2 — KPI Grid  (2-col mobile → 3-col desktop)
  └── KpiCard × 6  (Total Products, Clients, Stock Value,
                    Running Low *, Today Usage, Monthly Usage)
      * Running Low card is clickable → /shortages

Layer 3 — Charts Row  (stacked → 1.7fr / 1fr desktop)
  ├── ConsumptionTrendChart  (recharts AreaChart, segmented Daily/Weekly/Monthly)
  └── TopConsumedChart       (pure CSS progress bars, top 5 products)

Layer 4 — Bottom Row  (stacked → 1.5fr / 1fr desktop)
  ├── LowStockAlertsTable   (5 shortage rows, "نقل مخزون / Replenish" stub buttons)
  └── RecentActivityFeed    (6 activity items, typed icons per activity type)
```

---

## 🧩 Component Reference

### `KpiCard`
```tsx
<KpiCard
  icon={Package}
  iconBg="bg-ink-900"
  iconColor="text-amber-500"
  label={t.kpi.totalProducts}
  value={12}
  trend={{ label: '+٢', direction: 'up' }}
  sub={t.kpi.totalProductsSub}
  clickable    // optional — adds hover lift + cursor-pointer
  onClick={() => router.push('/shortages')}
/>
```

### `CardShell`
```tsx
<CardShell
  title="اتجاه الاستهلاك"
  action={<button>عرض الكل ←</button>}  // optional
  noPadding   // optional — skip the default p-5 body padding
>
  {children}
</CardShell>
```

### `ConsumptionTrendChart`
Self-contained. Owns the Daily/Weekly/Monthly segmented control state. Reads `locale` from `useI18n()` to localise the tooltip number format.

Chart series (mock):
| Mode | Points |
|------|--------|
| Daily | 14 points `[320 … 680]` |
| Weekly | 7 points `[2400 … 4100]` |
| Monthly | 6 points `[9800 … 12900]` |

### `TopConsumedChart`
Pure CSS (no library). Bars are proportional to the max value (1840). Values are formatted with the active locale.

### `LowStockAlertsTable`
Accepts `onReplenish(id: string)` — currently a no-op stub pending the TransferModal ticket.

Status colour:
- `low` → `text-warning-700`
- `out` → `text-danger-700`

### `RecentActivityFeed`
6 static items. Icon colours per type:

| Type | Icon | Colour |
|------|------|--------|
| `transfer` | Truck | `text-info-700` |
| `consumption` | MinusCircle | `text-warning-700` |
| `added` | PlusCircle | `text-success-700` |
| `adjust` | Edit3 | `text-ink-500` |

---

## 🌐 i18n Keys

Both `src/i18n/en/dashboard.json` and `src/i18n/ar/dashboard.json` cover:

```
dashboard.header.{eyebrow, greeting, subtitle, newTransfer}
dashboard.kpi.{totalProducts, totalProductsSub, totalClients, totalClientsSub,
               stockValue, stockValueSub, runningLow, runningLowSub,
               todayUsage, todayUsageSub, monthlyUsage, monthlyUsageSub}
dashboard.charts.{consumptionTrend, topConsumed, daily, weekly, monthly, today}
dashboard.lowStock.{title, viewAll, colProduct, colClient, colRemaining, colMin, replenish}
dashboard.activity.title
```

---

## 📦 Dependencies Added

| Package | Version | Reason |
|---------|---------|--------|
| `recharts` | ^2.x | Area chart for ConsumptionTrendChart |

---

## 🎨 Design Tokens Used

| Token | Value | Used for |
|-------|-------|----------|
| `--color-amber-100` | `#FEF3C7` | KPI icon backgrounds |
| `--color-info-100` | `#DBEAFE` | Clients KPI icon bg |
| `--color-success-100` | `#DCFCE7` | Today usage KPI icon bg |
| `--color-warning-100` | `#FEF9C3` | Running low KPI icon bg |
| `--shadow-xs` | `0 1px 2px …` | Segmented control active tab |
| `--shadow-sm` | `0 1px 4px …` | KPI card hover |
| `--font-serif` | IBM Plex Serif | Greeting heading + KPI values |

All tokens are defined in `src/app/globals.css` under `@theme`.

---

## 🔧 Layout & Responsive Behaviour

| Breakpoint | KPI Grid | Charts row | Bottom row |
|------------|----------|------------|------------|
| Mobile `<md` | 2 columns | stacked | stacked |
| Tablet `md–lg` | 2 columns | stacked | stacked |
| Desktop `≥lg` | 3 columns | 1.7fr / 1fr | 1.5fr / 1fr |

---

## ⚠️ Known Stubs (future tickets)

| Location | Stub | Future ticket |
|----------|------|---------------|
| "نقل جديد" button | `onClick={() => {}}` | TransferModal (FIGMA-005) |
| `onReplenish` in LowStockAlertsTable | no-op | TransferModal prefill (FIGMA-005) |
| "بوابة العميل" in More sheet | no-op button | Client portal page |
| All KPI values | hardcoded mock numbers | Phase 4 TICKET-028 (API integration) |

---

## ✅ Acceptance Criteria

- [x] All 6 KPI cards render with correct icon, colour, value, trend, sub-label
- [x] Running Low card navigates to `/shortages` on click
- [x] Consumption chart switches between Daily / Weekly / Monthly with smooth transition
- [x] Top Consumed bars are proportional to max value
- [x] Low Stock table shows 5 rows with correct status colours (warning / danger)
- [x] Recent Activity shows 6 items with correct type icons
- [x] All text is bilingual — switches on locale toggle in TopBar
- [x] Layout is fully responsive (2-col mobile → 3-col desktop grid)
- [x] TypeScript — `npx tsc --noEmit` passes with zero errors
- [x] Production build — `npx next build` succeeds

---

## 🔗 Related

- Layout shell: [admin-layout-shell.md](admin-layout-shell.md)
- Shortages page: FIGMA-006 (pending)
- Transfer modal: FIGMA-005 (pending)
- API integration: [ROADMAP.md](../../ROADMAP.md) — TICKET-028
