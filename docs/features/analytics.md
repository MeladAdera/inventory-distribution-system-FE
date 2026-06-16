# Feature: Analytics Module

**Status**: ✅ API Integrated  
**Created Date**: 2026-06-16  
**Last Updated**: 2026-06-16  
**Assignee**: Melad Adera

---

## 📋 Overview

### Purpose
The analytics module powers the two chart widgets on the dashboard:
- **TopConsumedChart** — horizontal bar chart showing the top 5 most-transferred products by total unit quantity
- **ConsumptionTrendChart** — area chart showing total units transferred per day / week / month

### Business Value
- Gives warehouse managers an instant visual of which products move the most
- Trend view lets managers spot volume drops before they become shortages
- Data is live from shipped/completed orders — no stale numbers

---

## 🏗️ Architecture

### File Structure
```
src/features/analytics/
├── types/
│   └── analytics.types.ts        # TopProduct, TrendPeriod, TrendPoint
├── api/
│   └── analytics.api.ts          # GET /analytics/top-products, GET /analytics/consumption-trend
└── hooks/
    ├── useTopProducts.ts          # TanStack Query — 5 min stale, returns TopProduct[]
    └── useConsumptionTrend.ts     # TanStack Query — 5 min stale, keepPreviousData
```

Charts live in `src/features/dashboard/components/` — the analytics module only provides types, API, and hooks.

---

## 🔌 API Endpoints

### `GET /analytics/top-products`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 5 | Max products to return (1–20) |

**Response:**
```json
{
  "success": true,
  "data": [
    { "product_id": 5, "product_name": "Water Bottle 500ml", "total_quantity": 100 },
    { "product_id": 9, "product_name": "Chocolate Bar 100g",  "total_quantity": 60  }
  ]
}
```

Sorted descending by `total_quantity`. Aggregates across orders with `status IN ('SHIPPED', 'RECEIVED', 'COMPLETED')`.

---

### `GET /analytics/consumption-trend`

| Param | Type | Options | Description |
|-------|------|---------|-------------|
| `period` | string | `daily` \| `weekly` \| `monthly` | Grouping bucket |

**Response:**
```json
{
  "success": true,
  "data": [
    { "label": "2026-06-10", "value": 340 },
    { "label": "2026-06-11", "value": 0   },
    { "label": "2026-06-16", "value": 210 }
  ]
}
```

`label` is always `YYYY-MM-DD`. The backend fills every bucket in the range with `value: 0` for days with no orders so the array is dense and the last element is always today.

**Period ranges:**
| Period | Points | Label format |
|--------|--------|--------------|
| `daily` | Last 14 days | `YYYY-MM-DD` |
| `weekly` | Last 8 week-starts | `YYYY-MM-DD` (Monday) |
| `monthly` | Last 6 month-starts | `YYYY-MM-DD` (1st of month) |

---

## 🪝 Hooks

### `useTopProducts(limit = 5)`
```typescript
const { topProducts, isLoading } = useTopProducts(5);
// topProducts: TopProduct[]
// TopProduct = { product_id, product_name, total_quantity }
```
- `staleTime`: 5 minutes
- Query key: `['analytics', 'top-products', limit]`

### `useConsumptionTrend(period)`
```typescript
const { trend, isLoading, isFetching } = useConsumptionTrend('daily');
// trend: TrendPoint[]  →  { label: string, value: number }
```
- `staleTime`: 5 minutes
- `placeholderData: keepPreviousData` — chart stays visible when switching periods; dims with `opacity-50` during refetch
- Query key: `['analytics', 'consumption-trend', period]` — each period cached independently

---

## 🧩 Chart Integration

### TopConsumedChart
- Calls `useTopProducts(5)` internally — no props
- 5-bar skeleton while loading; empty-state when `topProducts.length === 0`
- Bar widths: `pct = (item.total_quantity / max) * 100`
- Numbers formatted with active locale (`ar-SA` / `en-US`)

### ConsumptionTrendChart
- Owns `mode` state (`'daily' | 'weekly' | 'monthly'`) which drives the query
- Maps `TrendPoint[]` → `{ idx, value, label }` for recharts
- `lastIdx` always lands on today (dense array from backend)
- Tooltip shows the actual date label on hover
- Spinner on first load only; period switches dim the chart, not blank it

---

## ⚠️ Known Backend Behaviour

Orders in `PENDING` or `PROCESSING` are excluded — products haven't physically left the warehouse yet. If the backend narrows the filter back to `status = 'COMPLETED'` only, today's freshly-shipped orders will disappear from both charts.

---

## ✅ Acceptance Criteria

- [x] TopConsumedChart shows live product names and quantities
- [x] TopConsumedChart skeleton while loading
- [x] ConsumptionTrendChart fetches and renders correct period data
- [x] Switching Daily/Weekly/Monthly triggers a new fetch; previous data stays visible
- [x] "Today" label always appears on today's actual date
- [x] `npx tsc --noEmit` — zero errors

---

## 🔗 Related

- Dashboard page: [dashboard.md](dashboard.md)
- Backend analytics module: `src/analytics/` (BE repo)
