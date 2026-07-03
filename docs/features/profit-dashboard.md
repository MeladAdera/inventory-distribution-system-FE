# Feature: Profit Dashboard & Buying Price (Cost)

**Status**: ✅ API Integrated  
**Created Date**: 2026-07-04  
**Last Updated**: 2026-07-04  
**Assignee**: Melad Adera

---

## 📋 Overview

### Purpose
Profit tracking end-to-end, shared between both portals:

- **Buying price (`cost_price`)** — products now carry a second price (what it cost to acquire) next to the selling price. Editable on the create/edit product forms, shown on the detail modal.
- **Profit Dashboard** — a dedicated page with 3 stat cards (revenue / cost / profit) and a revenue–cost–profit trend chart, with the same daily / weekly / monthly period switcher used by the existing analytics charts.

| Route | Portal | Who sees it |
|-------|--------|-------------|
| `/profit` | Admin | `WAREHOUSE_ADMIN` — warehouse profit by default, any shop's sales profit via the scope selector |
| `/client/profit` | Client | `SHOP_OWNER` — auto-scoped to their own shop |
| — | — | `EMPLOYEE` — no nav link; middleware redirects `/client/profit` → dashboard (backend also returns `403`) |

### Business Value
- Warehouse admin sees margin on completed orders to shops, not just volume
- Shop owners see their own sales profit from receipts
- Profit is computed from **price snapshots taken at transaction time**, so editing a product's prices never rewrites history

---

## 🏗️ Architecture

### File Structure
```
src/features/admin/analytics/
├── types/analytics.types.ts        # + ProfitSummary, ProfitTrendPoint, ProfitParams
├── api/analytics.api.ts            # + profitSummary(), profitTrend()
├── hooks/
│   ├── useProfitSummary.ts         # TanStack Query — 5 min stale, keepPreviousData
│   └── useProfitTrend.ts           # same pattern
└── components/
    ├── ProfitDashboardPage.tsx     # orchestrator shared by both routes (isAdmin prop)
    ├── ProfitTrendChart.tsx        # pure recharts line chart — no fetching
    └── ProfitShopSelect.tsx        # admin-only scope switcher (fetches shops)

src/app/(admin)/profit/page.tsx     # <ProfitDashboardPage isAdmin />
src/app/client/profit/page.tsx      # <ProfitDashboardPage isAdmin={false} />
```

`ProfitShopSelect` is a separate component on purpose: it calls `useShops`, and it is only
mounted for admins — so shop owners never fire a `GET /shops` request from this page.

### Products — `cost_price` field
```
src/features/shared/products/
├── types/products.types.ts         # Product.cost_price: string | null; inputs: cost_price?: number
├── validations/products.schema.ts  # cost_price: z.number().min(0) — optional, max 2 decimals
└── components/
    ├── ProductFormModal.tsx        # "Buying price (SYP)" input next to selling price
    └── ProductDetailModal.tsx      # "Buying price" row — rendered only when non-null
```

---

## 🔌 API Endpoints

### `GET /analytics/profit-summary`

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `daily` | `daily` (14 days) · `weekly` (8 weeks) · `monthly` (6 months) |
| `shopId` | number | — | Admin only — a shop's sales profit instead of warehouse profit. Ignored for `SHOP_OWNER` |

**Response:**
```json
{ "revenue": 20352.27, "cost": 13143.75, "profit": 7208.52 }
```

Plain numbers (no string parsing). Empty period returns zeros, never `404`.

### `GET /analytics/profit-trend`

Same params and scoping. Returns ascending buckets, zero buckets omitted:
```json
[
  { "label": "2026-W25", "revenue": 2466.60, "cost": 1575.50, "profit": 891.10 }
]
```

Label formats match `consumption-trend`: `daily` → `YYYY-MM-DD`, `weekly` → `YYYY-Www`, `monthly` → `YYYY-MM`.

**Scoping matrix:**

| Caller | Data source | Meaning |
|--------|-------------|---------|
| `WAREHOUSE_ADMIN` (no `shopId`) | `order_items` of COMPLETED orders | Warehouse profit |
| `WAREHOUSE_ADMIN` + `shopId` | `receipt_items` of that shop | Shop's sales profit |
| `SHOP_OWNER` | `receipt_items` of own shop | Own sales profit |
| `EMPLOYEE` | — | `403` |

### Products — `cost_price`
- `POST /products` / `PATCH /products/:id` accept `cost_price` (number ≥ 0, optional, defaults to 0)
- All product objects return `cost_price` (string like `price`), **nullable**: shop users get `null` on warehouse products — the warehouse margin is private. Admin always sees it.

---

## 🪝 Hooks

### `useProfitSummary(params)`
```typescript
const { summary, isLoading, isFetching } = useProfitSummary({ period, shopId });
// summary: { revenue, cost, profit } — defaults to zeros while loading
```

### `useProfitTrend(params)`
```typescript
const { trend, isLoading, isFetching } = useProfitTrend({ period, shopId });
// trend: ProfitTrendPoint[] → { label, revenue, cost, profit }
```

Both: `staleTime` 5 min, `placeholderData: keepPreviousData` (chart dims with `opacity-50`
instead of blanking when switching period/scope). Query keys include the full params object.

---

## 🧩 UI Notes

- **Stat cards** reuse `KpiCard`; chart card reuses `CardShell` (both from `features/admin/dashboard`)
- **Chart series**: revenue (amber `#D97706`) and profit (green `#16A34A`) solid; cost (slate `#94A3B8`) dashed — the visual gap between revenue and profit *is* the cost
- **Currency** comes from i18n (`profit.currency`): `SYP` / `ل.س`, formatted with the active locale and 2 decimals; Y-axis uses compact notation
- **Legacy-data note** under the cards: transactions recorded before cost tracking have `cost = 0`, so older periods show profit ≈ revenue
- **Form rule**: the buying-price input is hidden in edit mode when the API returned `null` — an empty visible input would overwrite the hidden value with `0`. Empty input submits `undefined` (field omitted), via `setValueAs`
- **Client nav order**: profit sits after "My orders" so the mobile bottom bar (first 3 items) keeps Dashboard / Inventory / Order

---

## 🔐 Role Gating

- `/profit` added to `ADMIN_ROUTES` in `middleware.utils.ts`
- `/client/profit` gets employee-blocking for free: `EMPLOYEE_ALLOWED_ROUTES` is a whitelist (dashboard + inventory only)
- Nav: `EMPLOYEE_NAV_IDS` whitelist hides the link; no per-item role checks were added

---

## ✅ Acceptance Criteria

- [x] Admin sees warehouse profit by default; shop selector switches to per-shop sales profit
- [x] Shop owner sees own-shop profit with no selector
- [x] Employee: no nav entry, route redirects
- [x] Period switcher (daily/weekly/monthly) refetches; previous chart stays visible while fetching
- [x] Buying price editable on create/edit for admin and shop owner; hidden when API returns `null`
- [x] Detail modal renders buying price only when non-null
- [x] AR + EN keys for all new strings (`profit` namespace + nav labels)
- [x] `npx tsc --noEmit` — zero errors; `npm run build` — both routes prerender

---

## 🔗 Related

- Analytics module: [admin/analytics.md](admin/analytics.md)
- Products page: [admin/products.md](admin/products.md)
- Backend handoff: `FRONTEND_HANDOFF.md` (Products + Analytics sections)
