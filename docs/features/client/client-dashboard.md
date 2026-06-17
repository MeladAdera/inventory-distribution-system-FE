# Client Dashboard Page

**Status**: ✅ Complete (mock data)  
**Version**: 1.0.2  
**Ticket**: CLIENT-002  
**Route**: `/client/dashboard`  
**File**: `src/features/client-dashboard/components/ClientDashboardPage.tsx`  
**Page**: `src/app/client/dashboard/page.tsx`

---

## Overview

The client dashboard is the landing page for `SHOP_OWNER` users. It shows a snapshot of their shop inventory: KPI cards at the top, quick action buttons in the middle, and a low-stock alert list at the bottom.

---

## File Structure

```
src/features/client-dashboard/
├── components/
│   └── ClientDashboardPage.tsx    ← full page component
└── mock/
    └── clientInventory.ts         ← shared mock data (also used by inventory page)

src/app/client/dashboard/
└── page.tsx                       ← thin wrapper: <ClientDashboardPage />
```

---

## Layout

```
┌──────────────────────────────────────┐
│  Greeting + subtitle                 │
├──────────┬──────────┬────────────────┤
│ KPI card │ KPI card │   KPI card     │  ← grid-cols-2 md:grid-cols-3
│ (Total   │ (To      │   (Last Order) │     3rd card col-span-2 md:col-span-1
│ Products)│ Refill)  │               │
├──────────┴──────────┴────────────────┤
│ [Update Inventory]  [Order Products] │  ← grid-cols-1 sm:grid-cols-2
├──────────────────────────────────────┤
│ Low-stock list  ─OR─  All good state │
└──────────────────────────────────────┘
```

---

## Components (internal)

### KPI Grid

Reuses the admin `KpiCard` component from `src/features/dashboard/components/KpiCard.tsx`.

| Card | Value | Subtitle |
|---|---|---|
| Total Products | `CLIENT_INVENTORY.length` | from `t.client.dashboard.kpi.totalProductsSub` |
| To Refill | `LOW_STOCK_ITEMS.length` | from `t.client.dashboard.kpi.toRefillSub` |
| Last Order | hardcoded value | hardcoded order reference |

### Quick Actions

Two buttons side-by-side (`grid-cols-1 sm:grid-cols-2`):

| Button | Style | Action |
|---|---|---|
| Update Inventory | Paper / secondary | `router.push('/client/inventory')` |
| Order Products | Amber / primary | `router.push('/client/order')` |

### `StockBadge` (local)

Pill badge for LOW_STOCK (warning) and OUT_OF_STOCK (danger).

```tsx
<StockBadge status={StockStatus.LOW_STOCK} t={t} />
// → warning-coloured pill: "Low Stock"
```

### `LowStockItem` (local row component)

Each row in the low-stock list:
```
[ProductThumb 38px] [Name + "qty / min X"] [StockBadge] [Order more →]
```

- `ProductThumb` reused from `src/features/products/components/ProductThumb.tsx`
- "Order more" links to `/client/order`

### Empty state

When `LOW_STOCK_ITEMS.length === 0`:

```
CardShell + CheckCircle icon (success-600)
"All products have sufficient stock"
```

---

## Mock Data

Imports from `src/features/client-dashboard/mock/clientInventory.ts`:

```ts
import { CLIENT_INVENTORY, LOW_STOCK_ITEMS } from '../mock/clientInventory';
```

`LOW_STOCK_ITEMS` is pre-filtered: `CLIENT_INVENTORY.filter(item => item.status === LOW_STOCK || OUT_OF_STOCK)`.

---

## i18n Keys (`t.client.dashboard`)

```json
{
  "greeting":  "Hello, {shopName}",
  "subtitle":  "Here's a quick look at your inventory today.",
  "kpi": {
    "totalProducts": "Total Products",
    "totalProductsSub": "assigned to your account",
    "toRefill": "Items to Refill",
    "toRefillSub": "below minimum",
    "lastOrder": "Last Order",
    "lastOrderValue": "...",
    "lastOrderSub": "Order #..."
  },
  "actions": {
    "updateInventory": "Update Inventory",
    "orderProducts": "Order Products"
  },
  "lowStock": {
    "title": "Items Needing Restock",
    "current": "Current",
    "min": "Min",
    "orderMore": "Order more",
    "allGoodTitle": "All products have sufficient stock",
    "allGoodSub": "No items below minimum threshold.",
    "statusLow": "Low Stock",
    "statusOut": "Out of Stock"
  }
}
```

---

## API Integration (pending)

| Data point | Endpoint |
|---|---|
| Total products count | `GET /inventory?shopId=X` |
| Low-stock count | `GET /inventory?lowStock=true&shopId=X` |
| Last order date/ref | `GET /orders?limit=1&shopId=X` |
| Low-stock list | `GET /inventory?lowStock=true&shopId=X` |

---

## Reused Admin Components

| Component | Source |
|---|---|
| `KpiCard` | `src/features/dashboard/components/KpiCard.tsx` |
| `CardShell` | `src/features/dashboard/components/CardShell.tsx` |
| `ProductThumb` | `src/features/products/components/ProductThumb.tsx` |
| `StockStatus` enum | `src/features/products/types/products.types.ts` |
