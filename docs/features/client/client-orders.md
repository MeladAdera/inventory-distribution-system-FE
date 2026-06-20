# Client My Orders Page

**Status**: ✅ Complete (real API integrated)  
**Version**: 3.0.0  
**Ticket**: CLIENT-005  
**Route**: `/client/orders`  
**File**: `src/features/client-dashboard/components/ClientOrdersPage.tsx`  
**Page**: `src/app/client/orders/page.tsx`

---

## Overview

The My Orders page gives shop owners a filterable history of all their submitted product orders. Each row opens a detail modal that fetches the full order from `GET /orders/:id` — including the total price and all line items. Shop owners can **Confirm Received** (when status is `SHIPPED`) or **Cancel Order** (when status is `PENDING`) directly from the detail modal.

> **Backend dependency**: The `SHIPPED → RECEIVED` and `PENDING → CANCELLED` transitions require the backend to allow `SHOP_OWNER` on `PATCH /orders/:id/status`. See [Backend Requirements](#backend-requirements).

---

## File Structure

```
src/features/client-dashboard/
├── components/
│   ├── ClientOrdersPage.tsx           ← orchestrator: list hook + detail query + mutations + state
│   └── orders/
│       ├── OrderStatusBadge.tsx       ← stateless pill badge for all 6 order statuses
│       ├── OrdersTableCard.tsx        ← toolbar + desktop table + mobile cards + empty state
│       └── OrderDetailModal.tsx       ← detail modal: items, total price, action buttons, loading state
├── hooks/
│   └── useClientOrders.ts             ← list query + confirmReceived + cancelOrder mutations
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
    ↓  useClientOrders()     — unwraps data.data.data → ClientOrder[] (no total_price — list only)
    ↓  ClientOrdersPage      — holds statusFilter, selectedOrderId, modalOpen

  on "View" click:
    ↓  selectedOrderId set
    ↓  useQuery(['order-detail', id])   — GET /orders/:id
    ↓  maps response → ClientOrder (with total_price)
    ↓  OrderDetailModal receives full order

  on action button click:
    ↓  confirmReceived / cancelOrder mutation
    ↓  PATCH /orders/:id/status
    ↓  invalidates ['client-orders'] + ['order-detail', id]
    ↓  modal closes, list refreshes
```

---

## Key Types

```ts
// clientOrders.types.ts
interface ClientOrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;             // unit price as number
}

interface ClientOrder {
  id: number;
  status: OrderStatus;       // enum from orders.types.ts (includes CANCELLED)
  total_items: number;
  total_price?: number;      // present when fetched via GET /orders/:id
  created_at: string;        // ISO datetime
  items: ClientOrderItem[];
}

type ClientStatusFilter = 'ALL' | OrderStatus;
```

```ts
// orders.types.ts — OrderStatus enum
enum OrderStatus {
  PENDING    = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED    = 'SHIPPED',
  RECEIVED   = 'RECEIVED',
  COMPLETED  = 'COMPLETED',
  CANCELLED  = 'CANCELLED',
}
```

---

## State Model (`ClientOrdersPage`)

```ts
const [statusFilter, setStatusFilter]       // ClientStatusFilter — drives the select dropdown
const [selectedOrderId, setSelectedOrderId] // number | null — ID of order open in modal
const [modalOpen, setModalOpen]             // boolean — detail modal visibility

// Derived from selectedOrderId:
useQuery(['order-detail', selectedOrderId]) // GET /orders/:id — enabled only when ID is set
selectedOrder: ClientOrder | null           // mapped from by-ID response
```

`selectedOrderId` is set when "View" is clicked and never cleared — TanStack Query serves the cache instantly on re-open and refetches in background.

---

## `useClientOrders` Hook

```ts
const {
  orders,           // ClientOrder[] — from list endpoint (no total_price)
  total,            // number — server total count
  isLoading,        // boolean
  error,            // Error | null
  confirmReceived,  // (orderId: number) => Promise<void>
  cancelOrder,      // (orderId: number) => Promise<void>
  isConfirming,     // boolean
  isCancelling,     // boolean
} = useClientOrders();
```

On `confirmReceived` or `cancelOrder` success, both `['client-orders']` and `['order-detail', orderId]` are invalidated so neither the list nor the cached detail can show stale status.

---

## Page Header

Flex row, space-between:

| Side | Content |
|------|---------|
| Left | Title (`26px`, `--ink-900`) + `{total} orders` subtitle (`14px`, `--ink-500`) |
| Right | "+ Order products" amber button → `router.push('/client/order')` |

---

## OrdersTableCard

### Toolbar

Native `<select>` with seven options mapping to `ClientStatusFilter`:

| Value | EN label | AR label |
|-------|----------|----------|
| `ALL` | All statuses | كل الحالات |
| `PENDING` | Pending | في الانتظار |
| `PROCESSING` | Processing | قيد التنفيذ |
| `SHIPPED` | Shipped | تم الإرسال |
| `RECEIVED` | Received | تم الاستلام |
| `COMPLETED` | Completed | مكتمل |
| `CANCELLED` | Cancelled | ملغي |

Filtering is **client-side** (all orders fetched once, filtered in memory).

### Desktop Table (`hidden sm:block`)

Grid columns: `grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr]`

| Column | Content |
|--------|---------|
| Order # | `#ID` mono bold |
| Order date | `formatDate(created_at, locale)` |
| Items | `{total_items} items` |
| Status | `OrderStatusBadge` |
| Details | "View" button with `Eye` icon |

### Mobile Cards (`sm:hidden`)

```
[#ID]                     [StatusBadge]
[Date]
[N items]                 [View button]
```

---

## OrderStatusBadge

Pill with coloured dot — 6 statuses:

| Status | Background | Text | Dot |
|--------|-----------|------|-----|
| `PENDING` | `bg-sand-100` | `text-ink-600` | `bg-ink-400` |
| `PROCESSING` | `bg-warning-100` | `text-warning-700` | `bg-warning-700` |
| `SHIPPED` | `bg-info-100` | `text-info-700` | `bg-info-700` |
| `RECEIVED` | `bg-success-100` | `text-success-700` | `bg-success-700` |
| `COMPLETED` | `bg-sand-200` | `text-ink-500` | `bg-ink-400` |
| `CANCELLED` | `bg-danger-100` | `text-danger-700` | `bg-danger-700` |

---

## OrderDetailModal

Opened via "View" button. Uses `Modal size="lg"`. Fetches full order via `GET /orders/:id`.

### Loading state

While `isLoadingDetail` is true (or `order` is null), the modal body shows a centred `Loader2` spinner instead of content.

### Content layout

```
[StatusBadge]    #1042
                 15 / June / 2026

REQUESTED PRODUCTS
┌────────────────────────────────────────────────┐
│ [ProductThumb]  Product name    Unit price  Qty │
│ ...                                             │
├────────────────────────────────────────────────┤
│ Total price                         1,234.56    │  ← bg-sand-50, shown when total_price present
└────────────────────────────────────────────────┘

[info banner]  "Your order has been shipped..."   ← SHIPPED only

[Confirm received]  [Cancel order]  [Close]
```

### Action button rules

| Button | Shown when | Style |
|--------|-----------|-------|
| "Confirm received" | `status === SHIPPED` | `bg-success-700 hover:bg-success-700/90` green |
| "Cancel order" | `status === PENDING` | `bg-danger-700 hover:bg-danger-700/90` red |
| "Close" | always | secondary border button |

Both action buttons show `Loader2` spinner while the mutation is pending and are `disabled`.

---

## Loading / Error States

| State | UI |
|-------|----|
| List loading | `Loader2` spinner + `t.client.orders.loading`, centred in h-64 |
| List error | `AlertTriangle` + `t.client.orders.errorMsg`, centred |
| Detail loading | `Loader2` spinner centred inside open modal (h-40) |

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
    "completed": "Completed",
    "cancelled": "Cancelled"
  },
  "table": {
    "orderNo": "Order #", "date": "Order date", "items": "Items",
    "status": "Status", "details": "Details", "viewBtn": "View", "itemsUnit": "items"
  },
  "status": {
    "pending": "Pending", "processing": "Processing", "shipped": "Shipped",
    "received": "Received", "completed": "Completed", "cancelled": "Cancelled"
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
    "totalPrice": "Total price",
    "closeBtn": "Close",
    "shippedHint": "Your order has been shipped. Confirm receipt to update your inventory.",
    "confirmReceivedBtn": "Confirm received",
    "cancelOrderBtn": "Cancel order"
  },
  "toast": {
    "confirmReceivedSuccess": "Order marked as received. Your inventory has been updated.",
    "confirmReceivedError": "Failed to confirm receipt. Please try again.",
    "cancelSuccess": "Order cancelled successfully.",
    "cancelError": "Failed to cancel order. Please try again."
  }
}
```

---

## API Integration

| Action | Endpoint | Notes |
|--------|----------|-------|
| Load orders list | `GET /orders?limit=100` | Items in list; no `total_price` |
| Load order detail | `GET /orders/:id` | Full data including `total_price` |
| Confirm received | `PATCH /orders/:id/status` `{ status: "RECEIVED" }` | Requires backend SHOP_OWNER permission |
| Cancel order | `PATCH /orders/:id/status` `{ status: "CANCELLED" }` | Requires backend SHOP_OWNER permission |

Response envelope: `{ success, data: { ... } }`

---

## Backend Requirements

The following backend changes are needed for action buttons to work:

| Transition | Who | Constraint |
|-----------|-----|-----------|
| `SHIPPED → RECEIVED` | `SHOP_OWNER` | `to_shop_id` must match their shop |
| `PENDING → CANCELLED` | `SHOP_OWNER` | `to_shop_id` must match their shop |
| `PENDING/PROCESSING → CANCELLED` | `WAREHOUSE_ADMIN` | No ownership check |

Until the backend ships these changes, clicking either button returns `403`.

---

## Reused Components

| Component | Source |
|-----------|--------|
| `ProductThumb` | `src/features/products/components/ProductThumb.tsx` |
| `Modal` | `src/common/components/Modal.tsx` |
| `OrderStatus` enum | `src/features/orders/types/orders.types.ts` |
| `useI18n` | `src/providers/I18nProvider.tsx` |
| `useToast` | `src/providers/ToastProvider.tsx` |

---

## Acceptance Criteria

- [x] Page fetches orders list from `GET /orders?limit=100`
- [x] Status filter (client-side) covers all 6 statuses including `CANCELLED`
- [x] "View" button opens detail modal and fires `GET /orders/:id`
- [x] Modal shows spinner while detail is loading
- [x] Modal shows all line items with unit price and quantity
- [x] Modal shows total price row (from `GET /orders/:id` response)
- [x] "Confirm received" button shown for `SHIPPED` orders — calls `PATCH /orders/:id/status RECEIVED`
- [x] "Cancel order" button shown for `PENDING` orders — calls `PATCH /orders/:id/status CANCELLED`
- [x] Both action buttons show spinner while pending and are disabled
- [x] On action success: toast shown, modal closes, list + detail cache invalidated
- [x] On action error: toast error shown, modal stays open
- [x] `CANCELLED` badge shown in danger red
- [x] All text switches AR ↔ EN on locale toggle
- [x] `npx tsc --noEmit` passes with zero errors
