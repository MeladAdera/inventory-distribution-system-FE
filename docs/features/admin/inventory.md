# Feature: Admin Inventory Page

**Status**: Complete  
**Created Date**: 2026-07-02  
**Last Updated**: 2026-07-02  
**Assignee**: Melad Adera

---

## 📋 Overview

### Purpose
The Inventory admin page (`/inventory`) gives warehouse admins a real-time view of their own shop's stock. It surfaces KPI stat cards, a stock-health donut chart, a paginated top-products bar chart, and a searchable/filterable inventory table with an inline restock action.

### Business Value
- Single screen for a warehouse admin to monitor all stock levels without leaving the admin panel
- KPI cards surface the most critical numbers (total SKUs, total units, low-stock count, out-of-stock count) at a glance
- Clickable low-stock and out-of-stock cards instantly filter the table to the relevant rows
- Restock modal lets admins add stock without going to the Products page
- Scoped to the warehouse's own `shop_id` so clients' inventory is never mixed in
- Bilingual (AR/EN) with full RTL/LTR layout support and Levantine Arabic date formatting (تموز, آب…)

---

## 🏗️ Architecture

### File Structure

```
src/features/admin/inventory/
├── components/
│   ├── InventoryStatsCards.tsx   # 4 KPI stat cards (total SKUs, units, low, out-of-stock)
│   ├── StockHealthChart.tsx      # Recharts PieChart donut (healthy / low / out-of-stock)
│   ├── TopStockChart.tsx         # Recharts BarChart — sorted by qty desc, paginated (8/page)
│   ├── InventoryTable.tsx        # Searchable, filterable table — card layout on mobile, grid on desktop
│   └── InventoryRestockModal.tsx # Qty stepper modal → POST /inventory/stock-in
├── hooks/
│   └── useAdminInventory.ts      # TanStack Query list + stockIn mutation; computes stats via useMemo
└── InventoryPage.tsx             # Orchestrator: wires hook → components; owns lowStockFilter + restockItem state

src/features/shared/inventory/
├── api/
│   └── inventory.api.ts          # list, getLowStock, getById, stockIn, adjust — thin Axios wrappers
├── hooks/
│   └── useInventory.ts           # Shared hook for non-admin consumers
├── types/
│   └── inventory.types.ts        # InventoryItem, InventoryListParams, StockInInput, AdjustInventoryInput
├── validations/
│   └── inventory.schema.ts       # stockInSchema, adjustInventorySchema (Zod)
└── index.ts                      # Barrel export

src/app/(admin)/inventory/page.tsx   # Thin Next.js route wrapper
src/i18n/en/inventory.json           # English translations
src/i18n/ar/inventory.json           # Arabic translations
```

---

## 🔌 API Integration

### Endpoints Used

| Action | Method | Path | Where |
|--------|--------|------|-------|
| List inventory | GET | `/inventory` | `useAdminInventory` |
| Add stock | POST | `/inventory/stock-in` | `useAdminInventory.stockIn` |
| Get low stock | GET | `/inventory/low-stock` | `inventoryApi.getLowStock` (available, not used by this page) |
| Get single record | GET | `/inventory/:id` | `inventoryApi.getById` (available, not used by this page) |
| Adjust inventory | PATCH | `/inventory/:id` | `inventoryApi.adjust` (available, not used by this page) |

### Supported Query Params (`GET /inventory`)

| Param | Type | Notes |
|-------|------|-------|
| `limit` | number | Set to `9999` to fetch all records in one call |
| `shop_id` | number | Passed from `user.shopId` (auth store) — scopes results to this warehouse |
| `page` | number | Not used (full fetch) |
| `lowStock` | boolean | Not used (derived client-side) |
| `productId` | number | Not used by this page |

> **Note:** The backend may not yet filter by `shop_id` on `GET /inventory`. Until it does, `useAdminInventory` passes `shop_id` as a query param so the backend can adopt it without any FE change. If the backend returns all shops' records, filtering will fall through to the response data (the backend should be updated to support `shop_id` filtering).

### `POST /inventory/stock-in`

```ts
// Request body
{ productId: number; quantity: number; notes?: string }

// Response — updated inventory record (backend shape varies)
```

---

## 🧩 Type Reference

### `InventoryItem`
```ts
interface InventoryItem {
  id: number;
  shop_id: number;
  product_id: number;
  current_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
  product_name?: string;
  is_low_stock?: boolean;
}
```

### `InventoryListParams`
```ts
interface InventoryListParams {
  page?: number;
  limit?: number;
  lowStock?: boolean;
  productId?: number;
  shop_id?: number;
}
```

### `StockInInput`
```ts
interface StockInInput {
  productId: number;
  quantity: number;
  notes?: string;
}
```

### `AdminInventoryStats` (computed by hook)
```ts
interface AdminInventoryStats {
  totalSKUs: number;       // items.length
  totalUnits: number;      // sum of current_quantity
  lowStockCount: number;   // items where qty > 0 and (is_low_stock || qty <= threshold)
  outOfStockCount: number; // items where qty === 0
}
```

---

## 🔧 State & Data Flow

```
InventoryPage.tsx
  │
  ├── useAdminInventory()
  │     ├── shopId ← useAuthStore (s) => s.user?.shopId
  │     ├── useQuery(['admin-inventory', 'all', shopId])
  │     │     └── inventoryApi.list({ limit: 9999, shop_id: shopId })
  │     │           enabled: shopId !== undefined
  │     │           staleTime: 0  (always re-fetch on mount)
  │     ├── items: InventoryItem[]         ← unwrapped from response.data.data
  │     ├── stats: AdminInventoryStats     ← useMemo over items
  │     └── stockIn(input) → POST /inventory/stock-in → invalidates ['admin-inventory']
  │
  ├── lowStockFilter: boolean   ← useState; toggled by table toolbar and stat card clicks
  └── restockItem: InventoryItem | null  ← useState; set by table restock buttons
```

### Status derivation (client-side)
```ts
function getStatus(item): 'healthy' | 'low' | 'out' {
  if (item.current_quantity === 0) return 'out';
  if (item.is_low_stock || item.current_quantity <= item.low_stock_threshold) return 'low';
  return 'healthy';
}
```

---

## 🧩 Component Reference

### `InventoryStatsCards`
- 4 cards in a `grid-cols-2 lg:grid-cols-4` grid
- Low-stock and out-of-stock cards are clickable (`role="button"`, `tabIndex`, keyboard Enter/Space) — clicking sets `lowStockFilter = true` on the parent
- Number formatting respects locale (`ar-SA` for Arabic-Indic numerals, `en-US` for Latin)

### `StockHealthChart`
- Recharts `PieChart` donut, 55px inner / 85px outer radius
- Colour map: healthy `#22c55e`, low `#f59e0b`, out `#ef4444`
- Segments with `value === 0` are filtered out so the chart never shows empty arcs
- Legend rendered below the chart with colour dots and counts
- RTL-aware: `startAngle`/`endAngle` flipped for Arabic locale

### `TopStockChart`
- All `items` sorted by `current_quantity` descending, then paginated client-side at **8 products per page**
- Pagination arrows flank the chart; page indicator (`x / y`) shown only when `totalPages > 1`
- Product names truncated to 12 characters in axis labels; full name shown in tooltip via `payload.fullName`

### `InventoryTable`
- **Mobile (`< md`)**: one card per row — product name + status badge + qty / threshold / date + restock button
- **Desktop (`≥ md`)**: 7-column CSS grid `[40px_2fr_1fr_1fr_1fr_1fr_100px]`
- Toolbar: search input (debounce-free, filters via `useMemo`) + low-stock toggle button (amber active state)
- Pagination: 12 rows per page, arrows + `x / y` counter
- Low-stock filter shows all items where `getStatus(item) !== 'healthy'` (covers both `low` and `out`)

### `InventoryRestockModal`
- Custom modal built on `Card` (not the shared `Modal` component) — intentional, keeps it lightweight
- Qty stepper (–/+) with direct `<Input type="number">` entry; minimum value clamped to 1
- Local `loading` state drives the confirm button disabled state while the mutation is in flight
- Resets `qty` to 1 on each open via `useEffect([open])`

---

## 📱 Responsive Behaviour

| Breakpoint | Inventory Table | Charts | KPI Cards |
|------------|----------------|--------|-----------|
| Mobile `< md` | Card-per-row layout | Stacked full-width | 2-column grid |
| Desktop `≥ md` | 7-column CSS grid | Side-by-side (1fr / 2fr) | 4-column grid |

---

## 🌐 i18n Keys

Both `src/i18n/en/inventory.json` and `src/i18n/ar/inventory.json` cover:

```
inventory.page.{title, subtitle}
inventory.stats.{totalSKUs, totalSKUsSub, totalUnits, totalUnitsSub,
                 lowStock, lowStockSub, outOfStock, outOfStockSub}
inventory.charts.{health, healthy, low, out, topProducts, units, noData}
inventory.table.{title, searchPlaceholder, showLowStock, colNum, colProduct,
                 colQty, colThreshold, colStatus, colUpdated, colActions,
                 restock, empty}
inventory.status.{healthy, low, out}
inventory.restock.{title, subtitle, currentStock, label, confirm, cancel, success, error}
```

> **Date formatting:** Arabic dates use `ar-SY-u-nu-latn` locale — Gregorian calendar, Levantine month names (تموز, آب, أيلول…), Western Arabic numerals. Example output: `2 تموز 2026`.

---

## ⚠️ Known Gaps

| Gap | Location | Impact | Notes |
|-----|----------|--------|-------|
| `shop_id` filter not yet supported by backend | `GET /inventory` | Returns all shops' records; FE passes `shop_id` param ready for backend adoption | Backend team has been notified |
| New products have no inventory record | Backend | A newly added product won't appear in the inventory table until its first stock-in | Expected backend behaviour — no FE fix needed |
| `adjust` endpoint not wired to UI | `inventoryApi.adjust` exists | Quantity adjustments (corrections) are not possible from the inventory page | Future enhancement |

---

## ✅ Acceptance Criteria

- [x] Page is accessible at `/inventory` for `WAREHOUSE_ADMIN` role
- [x] Inventory link appears in the sidebar navigation between Products and Categories
- [x] KPI cards show correct totals derived from the fetched inventory items
- [x] Low-stock and out-of-stock KPI cards filter the table on click
- [x] Stock health donut chart reflects healthy / low / out proportions
- [x] Top products bar chart sorts by quantity descending and paginates at 8 per page
- [x] Chart pagination arrows disabled at first/last page
- [x] Inventory table shows all warehouse products with search and low-stock filter
- [x] Table paginates at 12 rows per page
- [x] Mobile: card layout renders correctly on `< 768px` viewport
- [x] Restock modal opens on row action, defaults qty to 1, clamps minimum to 1
- [x] Restock confirm calls `POST /inventory/stock-in` and refreshes the table
- [x] Skeleton shimmer shown while `isLoading`
- [x] Empty state shown when no items match the search/filter
- [x] All text switches AR ↔ EN on locale toggle
- [x] Arabic dates show Gregorian calendar with Levantine month names and Western numerals
- [x] `staleTime: 0` ensures fresh data on every page visit

---

## 🔗 Related

- Products feature: `src/features/admin/products/` — `inventoryApi.stockIn` is also called from `RestockModal` there
- Shared inventory API: `src/features/shared/inventory/api/inventory.api.ts`
- Auth store: `src/features/auth/store/authStore.ts` — `user.shopId` used to scope the query
- Backend API docs: `http://localhost:3000/api` (Swagger)
