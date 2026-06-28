# Client Receipts Page

**Status**: ✅ Complete (real API integrated)  
**Version**: 1.0.0  
**Ticket**: CLIENT-008  
**Route**: `/client/receipts`  
**File**: `src/features/shop/components/ClientReceiptsPage.tsx`  
**Page**: `src/app/client/receipts/page.tsx`

---

## Overview

The Receipts page gives shop owners and employees a paginated, filterable history of every batch stock-decrease event. A **Receipt** is created automatically whenever one or more inventory quantities are decreased together from the inventory page — it groups all the decreases into one atomic record with an optional note, a snapshot of before/after quantities, a price per item, and a total price.

The page replaces the old behavior where each inventory decrease was an independent `PATCH /inventory/:id` call with no shared record. Decreases now always go through `POST /receipts`. Stock **increases** continue to go through `POST /inventory/stock-in` (per item, with an optional reason).

> **Related change**: The inventory save modal (`InventorySaveModal`) was redesigned to split changes into two sections — a red "Stock decrease (saved as receipt)" section and a green "Stock increase" section, each with its own notes field.

---

## File Structure

```
src/features/shared/receipts/
├── types/
│   └── receipts.types.ts          ← Receipt, ReceiptItem, ReceiptListItem, CreateReceiptInput
├── api/
│   └── receipts.api.ts            ← list(), getById(), create()
├── hooks/
│   └── useReceipts.ts             ← useReceipts(params) + useReceiptDetail(id)
└── index.ts                       ← barrel export

src/features/shop/components/
├── ClientReceiptsPage.tsx          ← orchestrator: pagination + filters + modal state
└── receipts/
    ├── ReceiptsTableCard.tsx       ← DatePickerButton filters + desktop table + mobile cards
    └── ReceiptDetailModal.tsx      ← detail modal: items table (price/before/after) + total price

src/app/client/receipts/
└── page.tsx                        ← thin wrapper: <ClientReceiptsPage />
```

---

## Data Flow

```
GET /receipts?page=1&limit=15&fromDate=…&toDate=…
    ↓  receiptsApi.list()
    ↓  useReceipts(params)     — unwraps data.data.data → ReceiptListItem[]
    ↓  ClientReceiptsPage      — holds page, fromDate, toDate, selectedReceiptId, modalOpen

  on "View" click:
    ↓  selectedReceiptId set
    ↓  useReceiptDetail(id)    — useQuery(['receipts', id]) → GET /receipts/:id
    ↓  ReceiptDetailModal receives full Receipt (with items, price, total_price)

  on inventory save (decrease):
    ↓  receiptsApi.create({ items, notes })  — POST /receipts
    ↓  invalidates ['receipts'] query
    ↓  inventory quantities updated atomically by backend
```

---

## Key Types

```ts
// receipts.types.ts

interface ReceiptItem {
  id: number;
  inventory_id: number;
  product_id: number;
  product_name: string;
  quantity: number;         // units consumed (always positive)
  price: string;            // unit price snapshot at creation time
  quantity_before: number;
  quantity_after: number;
}

interface Receipt {
  id: number;
  shop_id: number;
  created_by: number;
  notes: string | null;
  created_at: string;       // ISO datetime
  total_price: number;      // sum of quantity × price for all items
  items: ReceiptItem[];
}

interface ReceiptListItem {
  id: number;
  shop_id: number;
  shop_name: string;
  created_by: number;
  created_by_name: string;
  total_items: number;
  notes: string | null;
  created_at: string;
  // Note: total_price is NOT in the list object — only in Receipt (detail)
}

interface CreateReceiptInput {
  items: { inventoryId: number; quantity: number }[];
  notes?: string;
}
```

---

## State Model (`ClientReceiptsPage`)

```ts
const [page, setPage]                       // number — current page (resets to 1 on filter change)
const [fromDate, setFromDate]               // string — ISO date filter start
const [toDate, setToDate]                   // string — ISO date filter end
const [selectedReceiptId, setSelectedReceiptId] // number | null
const [modalOpen, setModalOpen]             // boolean

// Derived:
useReceipts({ page, limit: 15, fromDate, toDate })  // server-paginated list
useReceiptDetail(modalOpen ? selectedReceiptId : null) // fetched only when modal is open
```

`selectedReceiptId` is never cleared after being set — TanStack Query serves the cached detail instantly on re-open.

---

## `useReceipts` Hook

```ts
const {
  receipts,       // ReceiptListItem[]
  total,          // number — server total count
  totalPages,     // number
  isLoading,      // boolean
  error,          // Error | null
  createReceipt,  // (input: CreateReceiptInput) => Promise<Receipt>
  isCreating,     // boolean
} = useReceipts(params);
```

`createReceipt` is called from `ClientInventoryPage.handleSave` (not from the receipts page itself). On success it invalidates `['receipts']`.

## `useReceiptDetail` Hook

```ts
const {
  receipt,    // Receipt | null
  isLoading,  // boolean
  error,      // Error | null
} = useReceiptDetail(id);  // enabled only when id !== null
```

---

## Page Header

```
[Typewriter tagline — cycles through 4 phrases]
{total} receipts
```

No action button — receipts are read-only and created only from the inventory page.

---

## ReceiptsTableCard

### Toolbar

Uses `DatePickerButton` (same component as the audit logs page) for both breakpoints — no raw `<input type="date">`.

**Mobile** (`sm:hidden`):
```
[  From  ]  —  [  To  ]
[clear link]               ← shown only when a filter is active
```

**Desktop** (`hidden sm:flex`):
```
[  From  ]  —  [  To  ]  [clear]
```

### Desktop Table (`hidden sm:block`)

Grid: `grid-cols-[auto_1fr_0.6fr_1.4fr_auto]`

| Column | Content |
|--------|---------|
| Receipt # | `Receipt # {id}` chip (small grey label + mono bold number, sand background) |
| Date | `formatDate(created_at, locale)` — short month format via `Intl.DateTimeFormat` |
| Items | `{total_items} items` |
| Notes | truncated notes text, or `—` if null |
| Details | "View" button with `Eye` icon |

### Mobile Cards (`sm:hidden`)

```
[ Receipt # 1 ]           [ View ]
2 items  ·  27 Jun 2026
End of day stock count      ← italic, line-clamp-2, hidden if no notes
```

The receipt ID chip shows `Receipt #` as small grey text with the bold mono number beside it — making the record type immediately clear without needing a column header.

---

## ReceiptDetailModal

Opened via "View". Uses `Modal size="md"`. Fetches full receipt via `GET /receipts/:id` only while the modal is open.

### Loading state

While `isLoading` is true or `receipt` is null, the modal body shows a centred `Loader2` spinner.

### Content layout

```
Date: 27 Jun 2026   Notes: End of day stock count

┌─────────────────────────────────────────────────────┐
│  PRODUCT          BEFORE  CONSUMED  AFTER  UNIT PRICE│
├─────────────────────────────────────────────────────┤
│  [thumb] Tuna Leo    12     −5        7      30.00   │
│  [thumb] Sardine Leo  4     −3        1       6.99   │
├─────────────────────────────────────────────────────┤
│  Total price                               36.99     │  ← bg-sand-50, bold
└─────────────────────────────────────────────────────┘

                                           [ Close ]
```

`CONSUMED` column shows `−{quantity}` in `text-danger-600`. `UNIT PRICE` column shows `(quantity × parseFloat(price)).toFixed(2)` — the line total. The footer row shows `receipt.total_price.toFixed(2)` which comes directly from the backend.

> `price` is a snapshot from the time the receipt was created — it does not change if the product price is updated later.

---

## Inventory Save Modal Changes

`InventorySaveModal` was redesigned to handle the two different save paths:

| Section | Colour | API call | Trigger |
|---------|--------|----------|---------|
| Stock decrease | Red border + `TrendingDown` icon | `POST /receipts` | `delta < 0` |
| Stock increase | Green border + `TrendingUp` icon | `POST /inventory/stock-in` per item | `delta > 0` |

Each section has its own textarea for notes/reason. The confirm button fires `handleSave({ decreaseNotes, increaseNotes })` in `ClientInventoryPage`, which:
1. If any decreases: calls `receiptsApi.create({ items, notes })` — one atomic request for all
2. If any increases: calls `inventoryApi.stockIn({ productId, quantity, notes })` per item in parallel

Both paths must succeed before the modal closes and the success toast fires.

---

## Loading / Error States

| State | UI |
|-------|----|
| List loading (first load) | `Loader2` spinner + `t.client.receipts.loading`, centred in `h-64` |
| List error | `AlertTriangle` + `t.client.receipts.errorMsg`, centred |
| Detail loading | `Loader2` spinner centred inside open modal |

---

## i18n Keys (`t.client.receipts`)

```json
{
  "title": "Receipts",
  "subtitle": "A record of every batch stock decrease made in your shop.",
  "loading": "Loading receipts…",
  "errorMsg": "Failed to load receipts. Please try again.",
  "taglines": [ "Every consumption, fully recorded", "…" ],
  "filter": {
    "fromDate": "From",
    "toDate": "To",
    "clear": "Clear"
  },
  "table": {
    "receiptNo": "Receipt #",
    "date": "Date",
    "items": "Items",
    "notes": "Notes",
    "details": "Details",
    "viewBtn": "View",
    "itemsUnit": "items",
    "noNotes": "—"
  },
  "empty": {
    "title": "No receipts yet",
    "sub": "Receipts are created automatically when you decrease stock quantities."
  },
  "modal": {
    "title": "Receipt details",
    "product": "Product",
    "consumed": "Consumed",
    "before": "Before",
    "after": "After",
    "price": "Unit price",
    "totalPrice": "Total price",
    "notesLabel": "Notes",
    "createdBy": "Created by",
    "date": "Date",
    "closeBtn": "Close",
    "noNotes": "No notes"
  },
  "toast": {
    "createSuccess": "Receipt saved successfully",
    "createError": "Failed to save receipt. Please try again."
  }
}
```

Inventory modal additions under `t.client.inventory.modal`:
```json
{
  "decreaseSection": "Stock decrease (saved as receipt)",
  "increaseSection": "Stock increase",
  "notesPlaceholder": "Reason or notes (optional)…",
  "receiptNotesLabel": "Receipt notes",
  "increaseNotesLabel": "Reason for increase"
}
```

---

## API Integration

| Action | Endpoint | Notes |
|--------|----------|-------|
| Load receipts list | `GET /receipts?page&limit&fromDate&toDate` | Server-paginated, 15 per page |
| Load receipt detail | `GET /receipts/:id` | Includes `items`, `price`, `total_price` |
| Create receipt (from inventory page) | `POST /receipts` | Atomic — all items or none; `quantity` always positive |

Response envelope: `{ success, data: { … } }`

**Error codes from `POST /receipts`:**

| `message` | Meaning |
|-----------|---------|
| `receipt.NEGATIVE_STOCK` | A decrease would bring a quantity below zero |
| `receipt.DUPLICATE_INVENTORY_IDS` | Same `inventoryId` appears twice in `items` |

---

## Nav

Added to `CLIENT_NAV_ITEMS` in `src/common/layout/clientNavConfig.ts`:

```ts
{ id: 'receipts', href: '/client/receipts', icon: Receipt }  // Receipt from lucide-react
```

Falls in the overflow group (position 5), shown in the "More" sheet on mobile.

---

## Reused Components

| Component | Source |
|-----------|--------|
| `DatePickerButton` | `src/common/components/DatePickerButton.tsx` |
| `ProductThumb` | `src/features/shared/products/components/ProductThumb.tsx` |
| `Modal` | `src/common/components/Modal.tsx` |
| `TypewriterText` | `src/common/components/TypewriterText.tsx` |
| `useI18n` | `src/providers/I18nProvider.tsx` |
| `useToast` | `src/providers/ToastProvider.tsx` |

---

## Acceptance Criteria

- [x] Receipts list fetched from `GET /receipts` with server-side pagination (15 per page)
- [x] Date range filter uses `DatePickerButton` (same component as audit logs)
- [x] Clear button appears only when a filter is active
- [x] Mobile card shows `Receipt # {id}` label chip, items count, date, and truncated notes
- [x] Desktop table shows receipt ID chip, date, items count, notes preview, and View button
- [x] "View" button opens detail modal and fires `GET /receipts/:id`
- [x] Modal shows spinner while detail is loading
- [x] Modal shows all line items: product name, before qty, consumed qty (−N in red), after qty, line total price
- [x] Modal shows total price footer row from `receipt.total_price`
- [x] Modal shows meta row: date + notes (notes hidden if null)
- [x] Inventory save modal splits decreases (receipt + notes) from increases (stock-in + reason)
- [x] Decreasing inventory creates one `POST /receipts` for all selected items atomically
- [x] Increasing inventory calls `POST /inventory/stock-in` per item with optional reason
- [x] On receipt creation success: toast shown, modal closes, inventory and receipts caches invalidated
- [x] All text switches AR ↔ EN on locale toggle
- [x] `npx tsc --noEmit` passes with zero errors
