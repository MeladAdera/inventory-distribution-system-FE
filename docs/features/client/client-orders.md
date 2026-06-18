# Client My Orders Page

**Status**: ✅ Complete (real API integrated)  
**Version**: 2.0.0  
**Ticket**: CLIENT-005  
**Route**: `/client/orders`  
**File**: `src/features/client-dashboard/components/ClientOrdersPage.tsx`  
**Page**: `src/app/client/orders/page.tsx`

---

## Overview

The My Orders page gives shop owners a read-only history of all their submitted product orders. It shows a filterable table with one row per order, and a detail modal that expands the full product list, quantities, and unit price for any selected order.

Data is fetched from `GET /orders` via `useClientOrders`. The page is a thin orchestrator — all rendering is delegated to domain-aware sub-components in `components/orders/`.

---

## File Structure

```
src/features/client-dashboard/
├── components/
│   ├── ClientOrdersPage.tsx           ← thin orchestrator: hook + state + wires atoms
│   └── orders/
│       ├── OrderStatusBadge.tsx       ← stateless pill badge for all 5 order statuses
│       ├── OrdersTableCard.tsx        ← toolbar + desktop table + mobile cards + empty state
│       └── OrderDetailModal.tsx       ← detail modal (items + price per line)
├── hooks/
│   └── useClientOrders.ts             ← TanStack Query, unwraps envelope, returns ClientOrder[]
└── types/
    └── clientOrders.types.ts          ← ClientOrder, ClientOrderItem, ClientStatusFilter

src/app/client/orders/
└── page.tsx                           ← thin wrapper: <ClientOrdersPage />
```

---

## Data Flow

```
GET /orders?limit=100
    ↓  ordersApi.list()
    ↓  useClientOrders()  — unwraps data.data.data, maps to ClientOrder[]
    ↓  ClientOrdersPage   — holds statusFilter, selectedOrder, modalOpen
       ↓                           ↓
  OrdersTableCard          OrderDetailModal
       ↓
  OrderStatusBadge
```

---

## Key Types

```ts
// clientOrders.types.ts
interface ClientOrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: string;           // e.g. "1200.00"
}

interface ClientOrder {
  id: number;
  status: OrderStatus;     // enum from orders.types.ts
  total_items: number;
  created_at: string;      // ISO datetime
  items: ClientOrderItem[];
}

type ClientStatusFilter = 'ALL' | OrderStatus;
```

---

## State Model (`ClientOrdersPage`)

```ts
const [statusFilter, setStatusFilter]   // ClientStatusFilter — drives the select dropdown
const [selectedOrder, setSelectedOrder] // ClientOrder | null — order open in modal
const [modalOpen, setModalOpen]         // boolean — detail modal visibility
```

---

## Page Header

Flex row, space-between:

| Side | Content |
|------|---------|
| Left | Title (`26px`, `--ink-900`) + `{total} orders` subtitle (`14px`, `--ink-500`) |
| Right | "+ Order products" amber button → `router.push('/client/order')` |

`total` comes from the paginated response's `total` field (not `orders.length`).

---

## OrdersTableCard

### Toolbar

Native `<select>` with six options mapping to `ClientStatusFilter`:

| Value | EN label | AR label |
|-------|----------|----------|
| `ALL` | All statuses | كل الحالات |
| `PENDING` | Pending | في الانتظار |
| `PROCESSING` | Processing | قيد التنفيذ |
| `SHIPPED` | Shipped | تم الإرسال |
| `RECEIVED` | Received | تم الاستلام |
| `COMPLETED` | Completed | مكتمل |

Filtering is **client-side** (all orders fetched once, filtered in memory).

### Desktop Table (`hidden sm:block`)

Grid columns: `grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr]`

| Column | Content | Style |
|--------|---------|-------|
| Order # | `#ID` | Mono `13px`, weight `600`, `--ink-900` |
| Order date | `formatDate(created_at, locale)` | `13px`, `--ink-600` |
| Items | `{total_items} items` | Mono `13px`, `--ink-700` |
| Status | `OrderStatusBadge` | See below |
| Details | "View" button with `Eye` icon | Secondary sm style |

### Mobile Cards (`sm:hidden`)

```
[#ID]                     [StatusBadge]
[Date]
[N items]                 [View button]
```

Cards stacked with `divide-y divide-border`.

---

## OrderStatusBadge

Pill badge with a coloured dot. All 5 backend statuses covered:

| Status | Background | Text | Dot |
|--------|-----------|------|-----|
| `PENDING` | `bg-sand-100` | `text-ink-600` | `bg-ink-400` |
| `PROCESSING` | `bg-warning-100` | `text-warning-700` | `bg-warning-700` |
| `SHIPPED` | `bg-info-100` | `text-info-700` | `bg-info-700` |
| `RECEIVED` | `bg-success-100` | `text-success-700` | `bg-success-700` |
| `COMPLETED` | `bg-sand-200` | `text-ink-500` | `bg-ink-400` |

---

## Empty State

Shown when `filtered.length === 0`:

- `ClipboardList` icon (32px, `--ink-400`)
- Title: `t.client.orders.empty.title`
- Action button: "Order products now" → `router.push('/client/order')`

---

## Loading / Error States

| State | UI |
|-------|----|
| Loading | `Loader2` spinner + `t.client.orders.loading` text, centered in 64 height |
| Error | `AlertTriangle` icon + `t.client.orders.errorMsg`, centered |

---

## OrderDetailModal

Opened via "View" button. Uses `Modal` with `size="lg"`.

**Order meta row**
```
[OrderStatusBadge]    #1042
                      15 / June / 2026
```

**Product list** — bordered box, one row per item:
```
[ProductThumb 28px]  [product_name]    Unit price   Requested qty
                                       [price]       [quantity]
```

**Footer**: "Close" secondary button (read-only modal).

---

## `formatDate` helper

Defined locally in both `OrdersTableCard` and `OrderDetailModal`:

```ts
function formatDate(iso: string, locale: 'ar' | 'en'): string {
  const date = new Date(iso);
  if (locale === 'ar') {
    const day = date.getDate();          // Western digit (e.g. 15)
    const year = date.getFullYear();
    const month = new Intl.DateTimeFormat('ar', { month: 'long' }).format(date);
    return `${day} / ${month} / ${year}`;  // → "15 / حزيران / 2026"
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);  // → "15 June 2026"
}
```

> Arabic uses **Western digits** for day/year and **Arabic month names** (e.g. حزيران for June).

---

## i18n Keys (`t.client.orders`)

```json
{
  "title": "My orders",
  "count": "orders",
  "newOrderBtn": "+ Order products",
  "loading": "Loading orders…",
  "errorMsg": "Failed to load orders. Please try again.",
  "filter": {
    "all": "All statuses",
    "pending": "Pending",
    "processing": "Processing",
    "shipped": "Shipped",
    "received": "Received",
    "completed": "Completed"
  },
  "table": {
    "orderNo": "Order #",
    "date": "Order date",
    "items": "Items",
    "status": "Status",
    "details": "Details",
    "viewBtn": "View",
    "itemsUnit": "items"
  },
  "status": {
    "pending": "Pending",
    "processing": "Processing",
    "shipped": "Shipped",
    "received": "Received",
    "completed": "Completed"
  },
  "empty": {
    "title": "You haven't placed any orders yet",
    "action": "Order products now"
  },
  "modal": {
    "title": "Order details",
    "productsLabel": "Requested products",
    "requestedQty": "Requested qty",
    "price": "Unit price",
    "notesLabel": "Notes",
    "closeBtn": "Close"
  }
}
```

---

## API Integration

| Action | Endpoint | Notes |
|--------|----------|-------|
| Load orders list | `GET /orders?limit=100` | Items included in list response |
| Status filter | Client-side (no refetch) | All orders fetched once |

Response envelope: `{ success, data: { data: Order[], total, page, limit, totalPages } }`
The hook unwraps to `data.data.data` to get the array.

---

## Reused Components

| Component | Source |
|-----------|--------|
| `ProductThumb` | `src/features/products/components/ProductThumb.tsx` |
| `Modal` | `src/common/components/Modal.tsx` |
| `OrderStatus` enum | `src/features/orders/types/orders.types.ts` |
| `useI18n` | `src/providers/I18nProvider.tsx` |
