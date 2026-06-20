# Feature: Transfers Admin Page (FIGMA-005)

**Status**: API-Integrated — Live  
**Created Date**: 2026-06-14  
**Last Updated**: 2026-06-20 (detail modal, total price, cache fix)  
**Assignee**: Melad Adera  
**Ticket**: FIGMA-005

---

## Overview

The Transfers admin page (`/transfers`) manages stock movements from the warehouse to shops via the `/orders` backend API. Warehouse admins can create transfers, advance them through a 5-stage status lifecycle, and open a **detail modal** to inspect all line items and the total price. Non-admin users see the list in read-only mode with the same detail modal.

The shared `TransferModal` is reusable from any page (Dashboard, Shortages) via a `prefill` prop.

---

## Architecture

### File Structure

```
src/features/transfers/
├── api/
│   └── transfers.api.ts           # Axios calls: list, getById, create, updateStatus, getShops, getProducts
├── hooks/
│   └── useTransfers.ts            # useTransfers (list+mutations), useTransferShops, useTransferProducts
├── components/
│   ├── TransfersTableCard.tsx     # Toolbar + 6-col CSS grid + status badges + admin actions + view button
│   ├── TransferModal.tsx          # New-transfer form: shop (admin) + product + qty + availability banner
│   └── TransferDetailModal.tsx    # Detail modal: items, total price, admin action button, loading state
├── types/
│   └── transfers.types.ts         # TransferStatus enum, Transfer, TransferItem, CreateTransferInput, …
├── mock/
│   └── transfersData.ts           # Empty — mock data removed, real API in use
└── index.ts                       # Barrel export

src/app/(dashboard)/transfers/page.tsx   # Page — permission gate, hooks, shop/status filter, create + detail
src/i18n/en/transfers.json               # English translations
src/i18n/ar/transfers.json               # Arabic translations
```

---

## Type Reference

### `TransferStatus` (enum)
```ts
enum TransferStatus {
  PENDING    = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED    = 'SHIPPED',
  RECEIVED   = 'RECEIVED',
  COMPLETED  = 'COMPLETED',
}
```

### `Transfer`
```ts
interface Transfer {
  id: number;
  from_shop_id: number;
  to_shop_id: number;
  to_shop_name?: string;
  status: TransferStatus;
  total_items: number;
  total_price?: number;      // present when fetched via GET /orders/:id
  created_at: string;        // ISO-8601
  updated_at: string;
  items?: TransferItem[];
}
```

### `TransferItem`
```ts
interface TransferItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;             // unit price as number (not string)
}
```

### `TransferOrderItem`
```ts
interface TransferOrderItem {
  productId: number;
  quantity: number;
}
```

### `CreateTransferInput`
```ts
interface CreateTransferInput {
  items: TransferOrderItem[];   // One or more product rows
  shopId?: number;              // Required when isAdmin = true
}
```

### `TransferPrefill`
```ts
interface TransferPrefill {
  productId?: number;
  quantity?: number;
}
```

### `NEXT_STATUS`
Maps each actionable status to its successor:
```ts
const NEXT_STATUS: Partial<Record<TransferStatus, TransferStatus>> = {
  PENDING:    PROCESSING,
  PROCESSING: SHIPPED,
  RECEIVED:   COMPLETED,
};
```
`SHIPPED → RECEIVED` is advanced by the shop side (client "Confirm Received" action).

---

## API Layer (`transfers.api.ts`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `list(params)` | `GET /orders` | Paginated transfer list with optional `page`, `limit`, `status` |
| `getById(id)` | `GET /orders/:id` | Single transfer with full `items[]` and `total_price` |
| `create(data)` | `POST /orders` | Create transfer — body: `{ items: [{ productId, quantity }], shopId? }` |
| `updateStatus(id, data)` | `PATCH /orders/:id/status` | Advance status |
| `getShops()` | `GET /shops?type=SHOP&limit=100` | Destination shop list |
| `getProducts()` | `GET /products?source=WAREHOUSE&limit=100` | Warehouse products for modal |

`getById` is called on-demand when the detail modal opens — **not** on page load.

---

## Hooks (`useTransfers.ts`)

### `useTransfers(params?)`
```ts
const {
  transfers,        // Transfer[]
  total,            // number — total server count (drives pagination)
  totalPages,       // number
  isLoading,        // boolean
  createTransfer,   // (data: CreateTransferInput) => Promise<void>
  isCreating,       // boolean
  updateStatus,     // ({ id, data }) => Promise<void>
  isUpdatingStatus, // boolean
} = useTransfers({ page, limit, status });
```

On `createTransfer` success: invalidates `['transfers']`.  
On `updateStatus` success: invalidates **both** `['transfers']` and `['transfer-detail', id]` so the open detail modal reflects the new status instantly.

### `useTransferShops()`
React Query for `GET /shops`. `staleTime: 5 min`. Returns `ApiResponse<PaginatedResponse<Shop>>`.

### `useTransferProducts()`
React Query for `GET /products?source=WAREHOUSE`. `staleTime: 5 min`. Returns `ApiResponse<PaginatedResponse<Product>>`.

---

## Data Flow

```
transfers/page.tsx
  │
  ├── useTransfers({ page, limit, status })   → transfers[], total, updateStatus
  ├── useTransferShops()                       → shops[]
  │
  ├── selectedTransferId (number | null)
  ├── useQuery(['transfer-detail', id])         → GET /orders/:id  (enabled: !!id)
  │     └── selectedTransfer = response.data
  │
  ├── onView(transfer) → setSelectedTransferId(transfer.id) + setDetailOpen(true)
  │
  ├── handleUpdateStatus(id, status)
  │     └── updateStatus() → toast.success / .error
  │           └── onSuccess: invalidates ['transfers'] + ['transfer-detail', id]
  │
  └── handleSave(items, shopId)
        └── createTransfer() → toast.success / .error

TransfersTableCard  ─── onView ──────────────►  TransferDetailModal
  └── "View" Eye button per row                    └── isLoadingDetail spinner
                                                    └── items grid + total price
                                                    └── admin action button
```

---

## Component Reference

### `TransfersTableCard`

| Prop | Type | Purpose |
|------|------|---------|
| `transfers` | `Transfer[]` | Current page's records |
| `total` | `number` | Server total count (for pagination) |
| `shops` | `Shop[]` | Destination shop list for toolbar filter |
| `isLoading` | `boolean` | Shows 6 skeleton rows |
| `page` | `number` | Current page number |
| `pageSize` | `number` | Records per page (10) |
| `shopFilter` | `string` | Selected shop ID string or `''` |
| `statusFilter` | `string` | Selected `TransferStatus` or `''` |
| `isAdmin` | `boolean` | Shows admin action buttons |
| `isUpdatingStatus` | `boolean` | Disables action buttons while mutating |
| `onShopChange` | `(v: string) => void` | — |
| `onStatusChange` | `(v: string) => void` | — |
| `onPageChange` | `(p: number) => void` | — |
| `onAddTransfer` | `() => void` | Opens modal from empty-state button |
| `onUpdateStatus` | `(id, status) => void` | Admin advances status from list row |
| `onView` | `(transfer: Transfer) => void` | Opens detail modal for a transfer |

**Grid columns**: `1.1fr 1.6fr 1.8fr 0.8fr 1.3fr 1.2fr`  
**Columns**: date | shop | product | qty | status | actions

**Status badges** (5 coloured pills):
| Status | Colours |
|--------|---------|
| PENDING | amber-50 / amber-700 |
| PROCESSING | blue-50 / blue-700 |
| SHIPPED | purple-50 / purple-700 |
| RECEIVED | teal-50 / teal-700 |
| COMPLETED | green-50 / green-700 |

**Admin action buttons** (dark `ink-900` pill, `h-7`):
- PENDING → "Process"
- PROCESSING → "Ship"
- RECEIVED → "Complete"
- SHIPPED → shows "Awaiting receipt" italic text (shop-side action)

**"View" button** (`Eye` icon + label) appears in the actions column for every row for all users (admin and read-only). Clicking fires `onView(transfer)`.

**Pagination**: smart ellipsis, `ChevronLeft/Right` arrows; only shown when `pageCount > 1`.

---

### `TransferDetailModal`

Opens via the "View" button. Uses `Modal size="lg"`. Data is fetched via `useQuery(['transfer-detail', id])` in the page — the modal receives the already-resolved `transfer` object.

| Prop | Type | Purpose |
|------|------|---------|
| `transfer` | `Transfer \| null` | Fully-fetched transfer (from `GET /orders/:id`) |
| `open` | `boolean` | Controls visibility |
| `onClose` | `() => void` | Closes modal |
| `isAdmin` | `boolean` | Shows advance-status button |
| `isLoadingDetail` | `boolean` | Shows spinner while detail is fetching |
| `isUpdatingStatus` | `boolean` | Disables action button while mutating |
| `onUpdateStatus` | `(id, status) => void` | Admin advances status from modal |
| `labels` | object | All i18n strings (title, shop, qty, price, totalPrice, closeBtn, statusLabels, actionLabels) |

**Loading state**: while `isLoadingDetail` is true or `transfer` is null, modal body shows a centred `Loader2` spinner (h-40).

**Content layout**:
```
[StatusBadge]  [ClientAvatar] Shop name
               15 / June / 2026

PRODUCTS
┌────────────────────────────────────────┐
│  [Thumb] Product name    Price    Qty  │
│  ...                                   │
├────────────────────────────────────────┤
│  Total price              1,234.56     │  ← bg-sand-50, shown when total_price present
└────────────────────────────────────────┘

[Admin action btn]                [Close]
```

**Admin action button**: appears when `isAdmin && NEXT_STATUS[transfer.status]` exists. Label comes from `actionLabels`. After clicking, detail modal closes automatically.

---

### `TransferModal`

| Prop | Type | Purpose |
|------|------|---------|
| `open` | `boolean` | Controls visibility |
| `onClose` | `() => void` | Closes modal |
| `onSave` | `(items: { productId: number; quantity: number }[], shopId?) => Promise<void>` | Submit handler |
| `prefill?` | `TransferPrefill` | Pre-selects product + qty on open |
| `isSaving?` | `boolean` | Disables confirm + shows `…` |
| `isAdmin?` | `boolean` | Shows shop selector field |
| `shops?` | `Shop[]` | Destination shop options (admin only) |

**Modal width**: `sm:max-w-130` (520px)

**Form fields:**
1. **Shop select** (admin only, required) — list from `useTransferShops` via page prop
2. **Products list** — dynamic rows via `useFieldArray`; each row is an independent `ProductRow` component:
   - Product `<select>` populated from `useTransferProducts`
   - Qty `<input>` (required, > 0, ≤ `availableQty`)
   - Remove button (hidden when only 1 row remains; shows `Trash2` icon otherwise)
   - Per-row availability hint "Available in warehouse: N" and green/red banner
   - Per-row `useProduct(productId)` call for real-time `current_quantity`
3. **"+ Add product"** button appends a new empty row (no upper limit)

**Availability banner per row**:
- Green (`#DDEEE3`): qty ≤ available
- Red (`#F6DDDB`): qty > available; that row's qty field is highlighted in danger red

---

## i18n Keys

Both `src/i18n/en/transfers.json` and `src/i18n/ar/transfers.json` cover:

```
transfers.page.{title, count, newTransfer}
transfers.toolbar.{allShops, allStatuses, export}
transfers.table.{date, shop, product, qty, status, actions, viewBtn}
transfers.status.{PENDING, PROCESSING, SHIPPED, RECEIVED, COMPLETED}
transfers.actions.{process, ship, complete, awaitingReceipt}
transfers.emptyState.{title, sub}
transfers.modal.{title, shopLabel, shopPlaceholder, productLabel, productPlaceholder,
                 productsLabel, addProduct,
                 qtyLabel, qtyHint, availableBanner, exceedsBanner, confirm, cancel,
                 errShop, errProduct, errQtyRequired, errQtyPositive, errQtyExceeds}
transfers.detail.{title, shop, productsLabel, qty, price, totalPrice, closeBtn}
transfers.pagination.{showing}
transfers.toast.{success, statusUpdated, error}
```

---

## Responsive Behaviour

| Breakpoint | Table header | Data rows | Modal |
|------------|-------------|-----------|-------|
| Mobile `<md` | Hidden | Stacked card (shop + date + product + status + action + view button) | Slide up from bottom (rounded-t-2xl) |
| Tablet/Desktop `≥md` | CSS grid 6-col | CSS grid 6-col | Centred overlay (max-w-130) |

---

## Permission Model

| Role | Can see page | Can create transfer | Can advance status | Can view detail |
|------|-------------|---------------------|--------------------|-----------------|
| Warehouse Admin | ✅ | ✅ (with shop selector) | ✅ | ✅ |
| Other roles | ✅ | ❌ (button hidden) | ❌ (action column empty) | ✅ (read-only) |

Powered by `usePermission()` → `{ isWarehouseAdmin, canCreate }`.

---

## Integration Points

### Use from Shortages page (prefill)
```tsx
<TransferModal
  open={transferOpen}
  onClose={() => setTransferOpen(false)}
  onSave={handleTransferSave}
  prefill={{ productId: shortage.product_id, quantity: shortage.suggested }}
/>
```
The modal resets to prefill values every time `open` transitions `false → true`.

### Query Invalidation
- `createTransfer` success → invalidates `['transfers']`
- `updateStatus` success → invalidates `['transfers']` **and** `['transfer-detail', id]`

The double invalidation ensures that if the detail modal is open when a status mutation completes, it re-fetches and shows the new status without requiring a manual close/reopen.

---

## Known Gaps

| Gap | Impact | Fix When |
|-----|--------|----------|
| No date range filter on toolbar | Can't filter by date in UI | Backend adds `from`/`to` params |
| `to_shop_name` may be absent if API doesn't embed it — falls back to `Shop #id` | Minor flash if shops not yet loaded | Ensure API embeds `to_shop_name` |

---

## Acceptance Criteria

- [x] Page fetches transfers from `/orders` — real data, server pagination
- [x] Shop filter (client-side on top of server status filter) narrows list; resets to page 1
- [x] Status filter sends `status` param to server; resets to page 1
- [x] Skeleton shimmer shows while `isLoading`
- [x] Empty state (Truck icon + "New transfer" button) shown when no transfers and `canCreate`
- [x] Warehouse admin sees "+ New transfer" button and admin action buttons
- [x] Non-admin sees page in read-only mode
- [x] "View" button visible for every row — opens `TransferDetailModal`
- [x] Detail modal shows spinner while `GET /orders/:id` is loading
- [x] Detail modal shows all line items with product name, unit price, and quantity
- [x] Detail modal shows total price row (from `GET /orders/:id` response)
- [x] Detail modal admin action button advances status; modal closes on success
- [x] After status update, both list and cached detail are invalidated (no stale data on re-open)
- [x] TransferModal: shop selector shown for admin only
- [x] TransferModal: product dropdown populated from warehouse products API
- [x] TransferModal: real-time availability fetched per selected product
- [x] TransferModal: green banner when qty ≤ available; red when qty > available
- [x] TransferModal: dynamic product rows via `useFieldArray` — "+ Add product" appends a row
- [x] TransferModal: each row independently validates product, qty, and stock availability
- [x] TransferModal: remove button on rows beyond the first; unavailable when only 1 row
- [x] TransferModal: Confirm disabled while saving or when admin hasn't selected a shop
- [x] On save: `POST /orders` called with `items[]` array; list invalidated; toast success
- [x] Admin action buttons in list row also advance status; toast success
- [x] SHIPPED row shows "Awaiting receipt" (shop-side action)
- [x] `prefill` prop pre-selects product + qty (Shortages integration)
- [x] Smart pagination with ellipsis and prev/next arrows
- [x] Mobile: stacked card layout below md breakpoint
- [x] All text switches AR ↔ EN on locale toggle
- [x] `npx tsc --noEmit` passes with zero errors

---

## Related

- Shops feature: `src/features/shops/` — `Shop` type used in modal and table
- Products feature: `src/features/products/` — `useProduct()` for real-time availability; `ProductThumb` in detail modal rows
- Clients feature: `src/features/clients/` — `ClientAvatar` reused for shop avatar in detail modal
- Shortages page: `src/app/(dashboard)/shortages/page.tsx` — opens `TransferModal` with `prefill`
- Client orders: `docs/features/client/client-orders.md` — shop-side "Confirm Received" that completes the `SHIPPED → RECEIVED` step
