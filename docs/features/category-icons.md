# Category Icons on Products

**Status**: ✅ Complete
**Type**: Cross-cutting UI change — admin products, client inventory / sell / order / catalog
**Created**: 2026-07-25
**Assignee**: Melad Adera

---

## Overview

Most products in this system have no photo. Every placeholder rendered the same generic `Package`
box, so a grid of un-photographed products was a wall of identical grey squares — nothing to scan
by shape.

Categories already carry a hand-picked Lucide icon (chosen with the category icon picker). That icon
is now the placeholder for the category's products, everywhere a product appears without an image:
drinks look like a cup, dairy like a milk carton. No new data was needed — the icon travels on rows
the FE already fetches.

`Package` remains the fallback when the category has no icon or the stored name isn't in the map.

---

## The resolver

```ts
// src/features/shared/categories/utils/categoryIcons.ts
getCategoryIcon(name?: string | null): LucideIcon   // unknown / null → Package
```

A fixed allow-list of ~50 grocery-relevant Lucide icons — the same map the category icon picker
offers, so a category can never store an icon name the product placeholder can't render.

---

## Where the icon is surfaced

Two shared placeholder components each grew one optional prop, `categoryIcon?: string | null`:

| Component | Used by |
|---|---|
| `ProductThumb` (small square) | admin products table, receipt detail rows, sell confirm modal |
| `ProductBanner` (card header) | client inventory `ProductCard`, `OrderProductCard`, `CatalogProductCard` |

Callers pass the icon name from whatever they already have in hand:

| Caller | Source of the icon name |
|---|---|
| `ProductsTableCard` → `ProductThumb` | `product.category_icon` (on the product row) |
| `ClientInventoryPage` → `ProductCard` | `selectedCat.icon` (the open category) |
| `ClientSellPage` → `SellProductTile` | `selectedCategory.icon` |
| `ClientOrderPage` → `OrderProductCard` | `selectedCategory.icon` |
| `CatalogProductCard` → `ProductBanner` | `item.category_icon` |

`SellProductTile` draws its own placeholder rather than using `ProductBanner`, so it calls
`getCategoryIcon` directly.

`ProductThumb` also gained a `className` prop (default `'flex'`), which is what lets the receipt
detail modal hide the thumb on mobile (`className="hidden sm:flex"`) — the display class had been
hardcoded in the component.

---

## Inventory rows now carry their category

```ts
interface InventoryItem {
  // …
  category_id?: number;
  category_name?: string;
  category_icon?: string | null;
}
```

`GET /inventory` joins the category server-side. That's what makes the icon available on the client
inventory/sell pages without a second lookup — and it also fixed a grouping bug.

### The "General" bucket bug

`useClientInventory` grouped inventory rows by looking each product up in a **separate**
`GET /products` query:

```ts
const categoryName = product?.category_name ?? 'General';   // ← before
```

Whenever that second query hadn't caught up — a just-created product, a stale persisted cache, a
product past the `limit: 100` page — the lookup missed and the item was silently dumped into a bogus
"General" category. Now the row's own joined category wins:

```ts
const categoryName = item.category_name ?? product?.category_name ?? 'General';
const categoryId   = item.category_id   ?? product?.category_id   ?? 0;
// group icon: item.category_icon ?? catMap.get(categoryId)?.icon ?? null
```

The products-list lookup is kept only as a fallback for older/partial rows.

---

## Related

- [Browse Catalog](client/client-catalog.md) — first consumer of `getCategoryIcon`, documents the icon field on catalog rows
- [Client Inventory](client/client-inventory.md) · [Quick Sell](client/client-sell.md) · [Client Order Page](client/client-order.md)
- [Admin Products](admin/products.md)
- [Offline PWA](offline-pwa.md) — the persisted cache whose staleness the grouping fix had to tolerate
