# Quick Sell Page

**Status**: ✅ Complete (real API integrated, offline-capable)
**Route**: `/client/sell`
**File**: `src/features/shop/components/ClientSellPage.tsx`
**Page**: `src/app/client/sell/page.tsx`
**Roles**: `SHOP_OWNER`, `EMPLOYEE`
**Last Updated**: 2026-07-25

---

## Overview

The till. A shop owner or employee standing at the counter taps products to build a sale, reviews the
tray, and confirms — producing one receipt. It's the fast path for the same "stock decrease" the
inventory page performs with steppers: the inventory page is for counting and correcting, this page
is for selling.

Two levels, same shape as the inventory page:

1. **Category grid** — search, then pick a category
2. **Product tiles** — one tap = +1 unit, capped at available stock
3. **Tray** (fixed bottom) — adjust quantities, see totals → **Confirm sale** modal → receipt

Every sale goes through the shared offline-first save path, so the till keeps working with no
network ([offline-pwa.md](../offline-pwa.md)).

---

## File Structure

```
src/features/shop/
├── components/
│   ├── ClientSellPage.tsx           ← orchestrator: cart + search + view state, no data fetching
│   ├── inventory/
│   │   └── CategoryCard.tsx         ← shared with the inventory page (`compact` variant here)
│   └── sell/
│       ├── SellProductTile.tsx      ← tappable tile: image/category icon, name, stock, qty badge
│       ├── SellTray.tsx             ← fixed bottom tray: per-line ± / remove, totals, Continue
│       └── SellConfirmModal.tsx     ← line list, totals, notes, "mark as free", Confirm sale
├── hooks/
│   └── useClientInventory.ts        ← reused as-is (same query keys as the inventory page)
└── types/clientInventory.types.ts

src/app/client/sell/page.tsx         ← thin wrapper: <ClientSellPage />
src/i18n/{en,ar}/client.json         ← t.client.sell.*
```

No sell-specific hook exists on purpose: the page sells what the shop already stocks, which is
exactly `useClientInventory()`'s data — same query keys, so the cache (and its offline persistence)
is shared with `/client/inventory`.

---

## Data Flow

```
useClientInventory()  →  categories: InventoryCategory[] (grouped)  +  allItems: EnrichedInventoryItem[]
      ↓
cart: Record<inventoryId, qty>          ← the only real state on the page
      ↓  derived
trayItems  = allItems where cart[id] > 0        → [{ item, qty }]
totalUnits = Σ qty
totalPrice = Σ Number(item.sale_price) × qty
      ↓  Confirm sale
enqueueStockSave({ changes: { [inventoryId]: -qty }, items: allItems, decreaseNotes, isFree, shopId })
      ↓
online  → POST /receipts (one atomic call)     toast "Sale recorded successfully"
offline → durably queued in IndexedDB          toast "You're offline — … will sync when you reconnect"
```

`getIsOnline()` is read **before** the enqueue so the toast reports what actually happened rather
than the connectivity state after the await.

---

## State Model (`ClientSellPage`)

```ts
const [selectedCatId, setSelectedCatId]  // string | null — null = category grid
const [cart, setCart]                    // Record<inventoryId, qty> — keyed by INVENTORY id, not product id
const [query, setQuery]                  // string — filters categories (grid) or products (tiles)
const [modalOpen, setModalOpen]          // boolean — confirm modal
const [isSubmitting, setIsSubmitting]    // boolean
```

- The cart is keyed by **inventory id** because that's what `POST /receipts` takes.
- `setQty(id, v)` deletes the key when `v <= 0`, so `cart` never holds zero entries and
  `trayItems`/badges need no filtering for them.
- `handleTap(id, stock)` = `min(current + 1, stock)` — the stock cap is enforced at the tap, so an
  out-of-stock tile simply can't be added.
- Switching category clears the search box but never the cart: the cart accumulates across
  categories.

---

## Totals — units *and* money

The tray and the confirm modal both show **Total price** alongside Total selected:

```
Total selected: 7 units
Total price:    43.50          ← amber, mono, tabular-nums
```

Computed client-side from `inventory.sale_price × qty` (`formatMoney` from `common/utils/money`) —
the same per-shop selling price the backend snapshots into `receipt_items.price`, so the number the
cashier reads out matches the receipt
([inventory-costing-and-pricing.md](../inventory-costing-and-pricing.md)).

Selling without a running total meant reading it off the receipt after the fact — useless when the
customer is standing there waiting to pay.

---

## Responsive category grid

The category grid is rendered twice, per breakpoint, because the two layouts want different card
shapes rather than the same card at a different width:

| Breakpoint | Grid | Card |
|---|---|---|
| `< sm` | `grid-cols-[repeat(auto-fill,minmax(100px,1fr))]`, `gap-2.5` | `CategoryCard compact` |
| `≥ sm` | `sm:grid-cols-2 lg:grid-cols-3`, `gap-4` | full `CategoryCard` |

`minmax(100px, 1fr)` with `auto-fill` lets the phone decide the column count (3 on a small phone, 4
on a large one) instead of hardcoding `grid-cols-3` and hoping.

### `CategoryCard` — `compact` prop

The inventory page's card, condensed for thumb-reach grids:

- Banner becomes `aspect-square` instead of `h-36`
- `p-1.5` body: category name (12px) + `{n} products` on one line each — no total-qty line, no
  edit/delete buttons, no warehouse badge
- The "added" indicator becomes an absolutely-positioned amber pill over the banner corner
  (`inset-e-1.5`, RTL-safe) instead of a text line in the body

Everything the compact card drops is management affordance — irrelevant while selling.

---

## Product tiles

`SellProductTile`: image if the product has one, otherwise the **category's Lucide icon** over a
palette-derived background ([category-icons.md](../category-icons.md)). Shows name, `Stock {n}` (or
"Out of stock"), and a qty badge once selected. Grid: `grid-cols-3 sm:grid-cols-4 md:grid-cols-5
lg:grid-cols-6`.

---

## Confirm modal

| Element | Notes |
|---|---|
| Line list | `ProductThumb` + name + `× qty` per item |
| Totals | Total selected + Total price |
| Notes | Optional, becomes the receipt's `notes` |
| **Mark as free** | Checkbox — sets `is_free` at creation time: cost still counts, revenue doesn't count toward profit |
| Confirm | Disabled + spinner while submitting; on failure the modal stays open (the error is re-thrown after the toast) so nothing is retyped |

---

## i18n Keys (`t.client.sell`)

```jsonc
{
  "loading", "errorMsg", "search", "addedBadge", "products", "backToCategories", "tapHint",
  "tile":  { "stock", "outOfStock" },
  "tray":  { "title", "totalUnits", "unitsUnit", "totalPrice", "continueBtn" },
  "modal": { "title", "intro", "notesLabel", "notesPlaceholder", "confirmBtn", "cancelBtn",
             "markFreeLabel", "markFreeHint" },
  "toast": { "success", "queued" },
  "empty": { "noCategories", "noProducts" },
  "taglines": [ "Tap products to build the sale", "…" ]   // TypewriterText header
}
```

Category-card labels are borrowed from `t.client.inventory` (`variants`, `totalQty`) — the card is
shared, so its copy is too. AR mirrored in `src/i18n/ar/client.json`.

---

## API Integration

| Action | Endpoint | Notes |
|---|---|---|
| Load sellable stock | `GET /inventory?limit=100` + `GET /products?limit=100` + `GET /categories?shopId=` | via `useClientInventory` — shared cache with `/client/inventory` |
| Record the sale | `POST /receipts` | `{ items: [{ inventoryId, quantity }], notes?, isFree? }` — atomic, queued when offline |

---

## Related

- [Client Inventory](client-inventory.md) — same data, counting/correcting instead of selling
- [Client Receipts](client-receipts.md) — where the produced receipts are read
- [Receipt Cancellation](../receipt-cancellation.md) — undoing a mis-entered sale
- [Offline PWA](../offline-pwa.md) — the sync queue this page writes through
- [Inventory Cost Basis & Selling Price](../inventory-costing-and-pricing.md) — `sale_price`, the source of the totals
