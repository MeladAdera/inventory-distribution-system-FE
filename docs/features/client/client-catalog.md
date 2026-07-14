# Client Catalog Page (Browse Catalog)

**Status**: ✅ Complete (real API integrated)
**Route**: `/client/catalog`
**File**: `src/features/shop/components/ClientCatalogPage.tsx`
**Page**: `src/app/client/catalog/page.tsx`

---

## Overview

The catalog page lets a shop owner discover warehouse products **not yet tracked** in their shop
and add them to inventory with one tap. It's the entry point for onboarding new products — reordering
products the shop *already* carries happens on the Order page instead
([client-order.md](client-order.md)).

Entry points: "Browse Catalog" button and empty-state CTA on the Inventory page
(`ClientInventoryPage.tsx`), both routing to `/client/catalog`.

Flow:
1. Browse/search/filter the warehouse catalog — each card shows whether the product is already
   in the shop and its current quantity if so.
2. Tap **Add** → `POST /inventory` registers the product on the shop's inventory at qty 0.
3. A toast with a **"Set stock"** action appears — optionally opens a bottom sheet to record an
   opening quantity via `PATCH /inventory/:id` (posted as an `adjustment`, so it flows through the
   same audit trail as any stock edit).

---

## File Structure

```
src/features/shop/
├── components/
│   ├── ClientCatalogPage.tsx          ← thin orchestrator: hook + search/filter state + wires atoms
│   └── catalog/
│       ├── CategoryChips.tsx          ← horizontal scroll chip filter ("All" + one per category)
│       ├── CatalogProductCard.tsx     ← product card (Add button / in-shop badge)
│       └── OpeningStockSheet.tsx      ← bottom sheet stepper for opening stock qty
├── hooks/
│   └── useCatalog.ts                  ← 1 query (products) + addToInventory + setOpeningStock mutations
└── types/
    └── catalog.types.ts               ← CatalogProduct, CatalogCategory

src/app/client/catalog/
└── page.tsx                           ← thin wrapper: <ClientCatalogPage />
```

---

## Data Flow

```
GET /products?source=WAREHOUSE&limit=100
    ↓  useCatalog()
       products already carry in_inventory + current_quantity for the caller's shop
       (backend join — no separate GET /inventory needed here)
       ├── group by category_name → CatalogCategory[]
       └── returns { categories, isEmpty, addingIds }

    ↓  ClientCatalogPage — query + activeCategory filter state
       ├── CategoryChips     — filter chips
       ├── CatalogProductCard  — per product
       │      onAdd → addToInventory(productId) → POST /inventory
       │           ↓ onSuccess: patch cached row { in_inventory: true, current_quantity }
       │           ↓ invalidate ['client-inventory'] + ['client-inventory-products']
       │           ↓ toast with "Set stock" action
       └── OpeningStockSheet
              onSave → setOpeningStock({ inventoryId, quantity }) → PATCH /inventory/:id
                   ↓ { adjustment: quantity, reason: 'Opening stock' }
```

`patchCatalogItem` updates the `['catalog']` query cache in place instead of refetching — the
idempotent backend makes a stale flag harmless even if a refetch happens later.

---

## Key Types

```ts
// catalog.types.ts
interface CatalogProduct extends Product {
  in_inventory: boolean;     // does this shop already track the product?
  current_quantity: number;  // this shop's current stock; 0 if not tracked
}

interface CatalogCategory {
  name: string;
  icon: string | null;   // category_icon travels on every product row — no separate category fetch
  items: CatalogProduct[];
}
```

> `GET /products?source=WAREHOUSE` enriches each product with the caller's own inventory status.
> These two fields are absent for admin callers (see `catalog.types.ts` doc comment).

---

## State Model (`ClientCatalogPage`)

```ts
const [query, setQuery]                 // string — search text (name or barcode)
const [activeCategory, setActiveCategory] // string | null — null = all categories
const [stockTarget, setStockTarget]      // { product, inventoryId } | null — opening stock sheet target
```

`visibleCategories` (derived via `useMemo`) filters categories by `activeCategory`, then filters
each category's items by `query` matching name or barcode, then drops empty categories.

---

## Product Card States

| State | Badge/meta text | Action |
|---|---|---|
| Not in shop | "Not in your shop" (ink-400) | `Add` button (amber) |
| In shop, qty > 0 | "In your shop · {qty} in stock" (success-700) | "Added" pill (success, disabled) |
| In shop, qty = 0 | "In your shop · out of stock" (success-700) | "Added" pill (success, disabled) |
| Adding (in flight) | — | `Add` button → spinner + "Adding…", disabled |

`addingIds: Set<number>` on the hook drives the per-card spinner without a full-page loading state.

---

## Opening Stock Sheet

Shown after a successful add, only if the toast's "Set stock" action is clicked — otherwise the
product stays at qty 0 (skippable, matches [[feedback_creation_time_flags]]-style creation-time
prompts but here it's optional, not required).

- Stepper: min 0, no max; free-text numeric input synced with the stepper
- **Save opening stock** — disabled while `qty <= 0` or saving
- **Skip — start at 0** — closes the sheet, no API call

---

## i18n Keys (`t.client.catalog`)

```json
{
  "title": "Browse Catalog",
  "subtitle": "Add warehouse products to your shop — they start out-of-stock, ready to reorder.",
  "search": "Search products…",
  "allChip": "All",
  "productsCount": "products",
  "loading": "Loading catalog…",
  "errorMsg": "Failed to load the catalog. Please try again.",
  "card": {
    "add": "Add",
    "adding": "Adding…",
    "added": "Added",
    "notInShop": "Not in your shop",
    "inShopStock": "In your shop · {qty} in stock",
    "inShopOut": "In your shop · out of stock"
  },
  "toast": {
    "added": "Added “{name}” to your shop",
    "setStock": "Set stock",
    "stockSet": "Opening stock saved"
  },
  "sheet": {
    "title": "Set opening stock",
    "hint": "Already have some on the shelf? Enter how many you're starting with.",
    "save": "Save opening stock",
    "skip": "Skip — start at 0"
  },
  "empty": {
    "noProducts": "The warehouse catalog is empty.",
    "noMatch": "No products match your search.",
    "clearSearch": "Clear search"
  }
}
```

---

## API Integration

| Action | Endpoint | Notes |
|--------|----------|-------|
| Load catalog | `GET /products?source=WAREHOUSE&limit=100` | Response rows include `in_inventory` + `current_quantity` for the caller's shop |
| Add to inventory | `POST /inventory` | `{ productId }` — idempotent; re-adding an already-tracked product returns the existing row, no duplicate created |
| Set opening stock | `PATCH /inventory/:id` | `{ adjustment: quantity, reason: 'Opening stock' }` — same code path as any stock adjustment |

On add success, `['client-inventory']` and `['client-inventory-products']` queries are invalidated
so the Inventory page reflects the new product immediately.

---

## Reused Components

| Component | Source |
|-----------|--------|
| `ProductBanner` | `src/features/shared/products/components/ProductBanner.tsx` |
| `BottomSheet` | `src/common/layout` |
| `getCategoryIcon` | `src/features/shared/categories/utils/categoryIcons.ts` |
| `useToast` | `src/providers/ToastProvider.tsx` |

---

## Related Features

- [Client Order Page](client-order.md) — restocking products already in inventory (this page is for *new* products instead)
- [Client Inventory](client-inventory.md) — links here from its "Browse Catalog" button and empty state
