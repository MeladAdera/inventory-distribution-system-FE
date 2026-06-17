# Client My Orders Page

**Status**: ✅ Complete (mock data)  
**Version**: 1.0.0  
**Ticket**: CLIENT-005  
**Route**: `/client/orders`  
**File**: `src/features/client-dashboard/components/ClientOrdersPage.tsx`  
**Page**: `src/app/client/orders/page.tsx`

---

## Overview

The My Orders page gives shop owners a read-only history of all their submitted product orders. It shows a filterable table with one row per order, and a detail modal that expands the full product list, quantities, and notes for any selected order.

---

## File Structure

```
src/features/client-dashboard/
├── components/
│   └── ClientOrdersPage.tsx    ← full page (all sub-components defined locally)
└── mock/
    └── clientOrders.ts         ← ClientOrder, OrderItem, OrderStatus, CLIENT_ORDERS

src/app/client/orders/
└── page.tsx                    ← thin wrapper: <ClientOrdersPage />
```

---

## State Model

```ts
const [statusFilter, setStatusFilter]   // 'all' | 'processing' | 'shipped' | 'received'
const [selectedOrder, setSelectedOrder] // ClientOrder | null — order open in modal
const [modalOpen, setModalOpen]         // boolean — detail modal visibility
```

---

## Page Header

Flex row, space-between:

| Side | Content |
|---|---|
| Left | Title (`26px`, `--ink-900`) + count subtitle (`14px`, `--ink-500`) |
| Right | "+ Order products" amber button → `router.push('/client/order')` |

---

## Table Card

### Toolbar

Native `<select>` (width 180px) with four options:

| Value | EN label | AR label |
|---|---|---|
| `all` | All statuses | كل الحالات |
| `processing` | Processing | قيد التنفيذ |
| `shipped` | Shipped | تم الإرسال |
| `received` | Received | تم الاستلام |

### Desktop Table (`hidden sm:block`)

Grid columns: `grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr]`

| Column | Content | Style |
|---|---|---|
| Order # | `#XXXX` | Mono `13px`, weight `600`, `--ink-900` |
| Order date | `Intl.DateTimeFormat` formatted | `13px`, `--ink-600` |
| Items | `N items` | Mono `13px`, `--ink-700` |
| Status | `OrderStatusBadge` | See below |
| Details | "View" button with `Eye` icon | Secondary sm style |

### Mobile Cards (`sm:hidden`)

Each order renders as a card with:
```
[#ID]                     [StatusBadge]
[Date]
[N items]                 [View button]
```

Cards are stacked with `divide-y divide-border`.

---

## Order Status Badge (`OrderStatusBadge`)

Pill badge with a coloured dot — same anatomy as `StatusBadge` in other pages.

| Status | Background | Text | Dot |
|---|---|---|---|
| `processing` | `bg-warning-100` | `text-warning-700` | `bg-warning-700` |
| `shipped` | `bg-info-100` | `text-info-700` | `bg-info-700` |
| `received` | `bg-success-100` | `text-success-700` | `bg-success-700` |

---

## Empty State

Shown when `filtered.length === 0` (no orders match the current filter):

- `ClipboardList` icon (32px, `--ink-400`)
- Title: `t.client.orders.empty.title`
- Action button: "Order products now" → `router.push('/client/order')`

---

## Order Detail Modal

Opened via "View" button. Uses `Modal` component with `size="lg"` (max-w-lg ≈ 512px).

**Section 1 — Order meta**

```
[OrderStatusBadge]    #1042
                      28 May 2026
```

**Section 2 — Requested products**

Border-box (radius 10px) containing one row per item:
```
[ProductThumb 28px]  [Product name]    Requested qty
                                       [qty value]
```

**Section 3 — Notes** (conditionally rendered when `order.notes` exists)

Label + note text below.

**Footer**: "Close" secondary button only (read-only modal).

---

## `formatDate` helper

```ts
function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));
}
```

`ar-SA` produces Eastern Arabic numerals automatically (e.g. `٢٨ مايو ٢٠٢٦`).

---

## Mock Data (`clientOrders.ts`)

### Types

```ts
type OrderStatus = 'processing' | 'shipped' | 'received';

interface OrderItem {
  productId: number;
  nameAr: string;
  nameEn: string;
  qty: number;
}

interface ClientOrder {
  id: number;
  date: string;      // ISO date string "YYYY-MM-DD"
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
}
```

### `CLIENT_ORDERS` (3 orders)

| ID | Date | Status | Items | Notes |
|---|---|---|---|---|
| 1042 | 2026-05-28 | processing | Energy drink×40, Hand soap×50, Canned tuna×60 | يرجى التوصيل صباحاً |
| 1041 | 2026-05-25 | shipped | Mineral water×200, Long-life milk×120 | — |
| 1040 | 2026-05-20 | received | Cheddar×30, OJ×48, Tissues×60, Water×300, Tuna×80 | الطلب الشهري |

---

## i18n Keys (`t.client.orders`)

```json
{
  "title": "My orders",
  "count": "orders",
  "newOrderBtn": "+ Order products",
  "filter": {
    "all": "All statuses",
    "processing": "Processing",
    "shipped": "Shipped",
    "received": "Received"
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
    "processing": "Processing",
    "shipped": "Shipped",
    "received": "Received"
  },
  "empty": {
    "title": "You haven't placed any orders yet",
    "action": "Order products now"
  },
  "modal": {
    "title": "Order details",
    "productsLabel": "Requested products",
    "requestedQty": "Requested qty",
    "notesLabel": "Notes",
    "closeBtn": "Close"
  }
}
```

---

## API Integration (pending)

| Action | Endpoint |
|---|---|
| Load orders list | `GET /orders?shopId=X` |
| Filter by status | `GET /orders?shopId=X&status=processing` |
| Order detail | `GET /orders/:id` |

---

## Reused Components

| Component | Source |
|---|---|
| `ProductThumb` | `src/features/products/components/ProductThumb.tsx` |
| `Modal` | `src/common/components/Modal.tsx` |
| `useI18n` | `src/providers/I18nProvider.tsx` |
