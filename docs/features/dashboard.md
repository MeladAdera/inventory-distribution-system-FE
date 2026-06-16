# Feature: Dashboard Page (FIGMA-002)

**Status**: ✅ API Integrated  
**Created Date**: 2026-06-11  
**Last Updated**: 2026-06-16  
**Assignee**: Melad Adera  
**Ticket**: FIGMA-002

---

## 📋 Overview

### Purpose
The dashboard is the default landing page after login (`/dashboard`). It gives the warehouse manager an at-a-glance overview of inventory health: live KPI metrics, consumption trends, top-consumed products, low-stock alerts, and recent activity — all from real backend data.

### Business Value
- 6 KPI cards surface live counts (products, shops, pending/total/completed orders, low-stock items)
- Clickable "Running Low" KPI navigates directly to the Shortages page
- Charts powered by the analytics API — no stale mock numbers
- Recent Activity timestamps are locale-aware (AR/EN via `Intl.RelativeTimeFormat`)
- Bilingual (AR/EN) with full RTL/LTR layout support

---

## 🏗️ Architecture

### File Structure
```
src/features/dashboard/
├── components/
│   ├── KpiCard.tsx                # Reusable metric card (icon, value, trend, sub-label)
│   ├── CardShell.tsx              # Shared card container (title header + action slot)
│   ├── ConsumptionTrendChart.tsx  # Area chart (daily/weekly/monthly) — real API
│   ├── TopConsumedChart.tsx       # CSS horizontal bar chart (top 5) — real API
│   ├── LowStockAlertsTable.tsx    # Mini 5-row table — real API via useShortages()
│   └── RecentActivityFeed.tsx     # Chronological activity list — real API via useAuditLogs()
└── hooks/
    └── useDashboardStats.ts       # 6 parallel TanStack Query calls for KPI values

src/app/(dashboard)/dashboard/page.tsx   # Page — composes all four layers
src/i18n/en/dashboard.json               # English translations
src/i18n/ar/dashboard.json               # Arabic translations
```

### Page Layout (4 layers)
```
Layer 1 — Page Header
  ├── Eyebrow label
  ├── Greeting heading (IBM Plex Serif, 34px)
  ├── Subtitle
  └── "New Transfer" button → /transfers

Layer 2 — KPI Grid  (2-col mobile → 3-col desktop)
  └── KpiCard × 6  (Total Products, Total Shops, Pending Orders,
                    Running Low *, Total Orders, Completed Orders)
      * Running Low card → /shortages

Layer 3 — Charts Row  (stacked → 1.7fr / 1fr desktop)
  ├── ConsumptionTrendChart  (recharts AreaChart, Daily/Weekly/Monthly)
  └── TopConsumedChart       (CSS progress bars, top 5 products)

Layer 4 — Bottom Row  (stacked → 1.5fr / 1fr desktop)
  ├── LowStockAlertsTable   (5 rows, "Replenish" → /shortages)
  └── RecentActivityFeed    (6 audit log items, locale-aware timestamps)
```

---

## 🪝 Data Hooks

### `useDashboardStats`
Runs 6 parallel queries on mount (1-minute staleTime each):

| Query key | Endpoint | Value extracted |
|-----------|----------|-----------------|
| `['dashboard', 'products-total']` | `GET /products?limit=1` | `data.total` |
| `['dashboard', 'shops-total']` | `GET /shops?type=SHOP&limit=1` | `data.total` |
| `['dashboard', 'pending-orders']` | `GET /orders?status=PENDING&limit=1` | `data.total` |
| `['dashboard', 'low-stock-count']` | `GET /inventory?lowStock=true&limit=1` | `data.total` |
| `['dashboard', 'total-orders']` | `GET /orders?limit=1` | `data.total` |
| `['dashboard', 'completed-orders']` | `GET /orders?status=COMPLETED&limit=1` | `data.total` |

While loading, all KPI values display `'—'`.

### Self-contained components
- **LowStockAlertsTable** — calls `useShortages()` internally; shows first 5 rows; "Replenish" → `/shortages`
- **RecentActivityFeed** — calls `useAuditLogs({ limit: 6 })`; timestamps via `formatRelativeTime(locale)` — fully locale-aware (Arabic/English)
- **Charts** — see [analytics.md](analytics.md)

---

## 🌐 i18n Keys

```
dashboard.header.{eyebrow, greeting, subtitle, newTransfer}
dashboard.kpi.{totalProducts, totalProductsSub,
               totalClients, totalClientsSub,
               stockValue, stockValueSub,        ← Pending orders
               runningLow, runningLowSub,
               todayUsage, todayUsageSub,         ← Total orders
               monthlyUsage, monthlyUsageSub}     ← Completed orders
dashboard.charts.{consumptionTrend, topConsumed, daily, weekly, monthly, today}
dashboard.lowStock.{title, viewAll, colProduct, colClient, colRemaining, colMin, replenish}
dashboard.activity.title
```

---

## ✅ Acceptance Criteria

- [x] All 6 KPI cards show live values; display `—` while loading
- [x] Running Low KPI navigates to `/shortages`
- [x] "New Transfer" button navigates to `/transfers`
- [x] Consumption chart switches Daily/Weekly/Monthly with cached fallback
- [x] Top Consumed bars show real product names and quantities
- [x] Low Stock table shows 5 live shortage rows
- [x] Recent Activity timestamps switch language with locale toggle
- [x] Fully responsive (2-col mobile → 3-col desktop)
- [x] `npx tsc --noEmit` — zero errors

---

## 🔗 Related

- Analytics charts: [analytics.md](analytics.md)
- Shortages page: [shortages.md](shortages.md)
- Transfers page: [transfers.md](transfers.md)
