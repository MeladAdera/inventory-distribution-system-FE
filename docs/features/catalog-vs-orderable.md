# Catalog-only vs. Orderable Products

**Status**: ✅ Complete (real API integrated)
**Type**: Cross-cutting product model change — admin products, admin inventory, client order page, admin dashboard
**Created**: 2026-07-25
**Assignee**: Melad Adera

---

## Overview

The warehouse catalog holds two different kinds of rows, and before this change the UI treated them
as one:

| | `is_orderable: true` | `is_orderable: false` (catalog-only) |
|---|---|---|
| What it is | A product the warehouse actually stocks and fulfils | A listing/template — a known product the warehouse does **not** supply |
| Shops can add it to their own inventory | ✅ | ✅ |
| Shops can order it from the warehouse | ✅ | ❌ `POST /orders` rejects it |
| Appears on the client Order page | ✅ (when in stock) | ❌ |
| Counts in the dashboard "products" KPI | ✅ | counted separately |

Catalog-only rows exist so a shop can track something it buys elsewhere (or that the warehouse
hasn't started carrying yet) using the shared catalog instead of creating a duplicate local product —
see [Browse Catalog](client/client-catalog.md).

Without the flag surfaced in the UI, shops could fill a cart with products the warehouse can't ship
and only discover it at submit time, and the admin dashboard counted templates as stocked products.

---

## The flag

```ts
interface Product {
  // …
  /** false = catalog-only listing (no real warehouse stock); cannot be ordered via POST /orders. */
  is_orderable: boolean;
}

interface ProductListParams {
  // …
  is_orderable?: boolean;     // GET /products filter
}

// settable on create + update
CreateProductInput.is_orderable?: boolean
UpdateProductInput.is_orderable?: boolean
```

---

## Admin — Products page (`/products`)

| Piece | Behaviour |
|---|---|
| Toolbar filter | Third select: **All availability** / **Orderable** / **Catalog only**. Local state is `'' \| 'true' \| 'false'`, mapped to `is_orderable?: boolean` (`''` → `undefined`); changing it resets to page 1 like the other filters |
| Table row | A grey **"Catalog only"** pill next to the product name when `!is_orderable` — desktop grid row and mobile card (beside the active/inactive `StatusBadge`) |
| Form modal | Checkbox **"Available to order from warehouse"** with the hint *"Off = catalog-only listing. Shops can add it to their inventory but can't order it from the warehouse."* Defaults to **on** for new products |

The checkbox is gated behind a new `showOrderableFlag` prop on `ProductFormModal`, passed only by the
admin products page. `ProductFormModal` is shared with shop-owner flows, where the flag is
warehouse-only policy and must not appear — and `is_orderable` is only included in the create/update
payload when the flag was actually rendered.

### Selling price is editable again — for admins only

`showOrderableFlag` doubles as "this is the warehouse admin's own catalog", so the price field is
now shown on **edit** as well as create:

```ts
const showPrice = mode === 'add' || showOrderableFlag;
```

Rationale: `products.price` is the warehouse list price, which the admin owns and does need to
correct. Shop users still don't get it on edit — their selling price is the per-shop
`inventory.sale_price`, edited on the inventory card
([inventory-costing-and-pricing.md](inventory-costing-and-pricing.md)).

### Two schemas, because price is conditional

```ts
productFormSchema      // price: z.number().optional()          ← edit (field may be hidden)
productFormAddSchema   // price: z.number().positive(...)       ← add / admin edit (field rendered)
```

`resolver: zodResolver(showPrice ? productFormAddSchema : productFormSchema)`.

This fixed a silent failure: catalog products are often seeded with `price = 0`, and the old
unconditional `positive()` rule rejected the hidden field on every edit submit — no visible error,
no request, the form just did nothing.

### Zero opening stock no longer posts

`ProductFormModal`'s **Initial quantity** field appears wherever an `onStockIn` handler is passed —
today that's the shop owner creating a local product from `/client/inventory` (the admin products page
is catalog-only; stock-in lives on `/inventory`). `POST /inventory/stock-in` rejects `quantity: 0`
(*"quantity must be a positive number"*), so a blank/zero value now skips the call entirely instead of
firing a request known to fail:

```ts
if (onStockIn && data.initialQuantity && data.initialQuantity > 0) { … }
```

---

## Admin — Inventory page (`/inventory`)

Stocking a catalog-only product is exactly the moment its status should change: the warehouse now
*has* it. `StockInModal` asks in the same step instead of sending the admin to the Products page.

```
Product select → catalog-only product picked
      ↓
amber panel: ☑ "Also make this product orderable by shops"
             "This product is catalog-only right now — shops can't order it until it's marked orderable."
      ↓  confirm
POST /inventory/stock-in { productId, quantity, unitCost? }
      ↓  then, only if checked
PATCH /products/:id { is_orderable: true }
```

- The panel renders only when `selectedProduct && !selectedProduct.is_orderable` — an already
  orderable product has nothing to decide.
- Default **checked**: stocking something is a strong signal it should be orderable, and the toggle
  is right there to opt out.
- `makeOrderable` is passed as `undefined` when the panel wasn't shown, so `InventoryPage` never
  fires a pointless PATCH. It reuses `useProducts().updateProduct`, which invalidates `['products']`.
- Resets on every product change and on modal open.

Same principle as the opening-stock prompt on [Browse Catalog](client/client-catalog.md): ask at the
moment the decision is natural, don't force a second trip to another screen.

---

## Client — Order page (`/client/order`)

The product picker now asks the backend for exactly what is orderable *and* in stock:

```ts
productsApi.list({
  source: ProductSource.WAREHOUSE,
  is_orderable: true,                  // drop catalog-only listings
  stock_status: StockStatus.IN_STOCK,  // drop orderable products the warehouse currently has 0 of
  limit: 100,
});
```

Both filters are needed: `is_orderable` is a policy flag, `IN_STOCK` is live availability. A product
can be flagged orderable and still be unshippable today.

**Stale-cache recovery** — the picker list is cached, so it can be a few minutes behind the
warehouse. A `400` from `POST /orders` (not orderable / out of stock / insufficient stock) now
invalidates `['order-products']`:

```ts
onError: (err) => {
  if (isAxiosError(err) && err.response?.status === 400) {
    queryClient.invalidateQueries({ queryKey: ['order-products'] });
  }
}
```

The shop sees the error toast and the list corrects itself instead of letting them retry the same
impossible order.

### `StockStatus.IN_STOCK` and `DisplayStockStatus`

`IN_STOCK` was added to the `StockStatus` enum purely as a `GET /products` **query value** — it is
never a computed per-item display state (an item is high / low / out). Adding it to the enum broke
every `Record<StockStatus, …>` style map, so the display subset is now its own type:

```ts
/** The 3 states computeStatus() actually produces; excludes the IN_STOCK query-only filter value. */
export type DisplayStockStatus = Exclude<StockStatus, StockStatus.IN_STOCK>;
```

Used by `computeStatus()` in `useClientInventory` / `useClientOrderProducts`, `InvStatusBadge`'s
style + label maps, `EnrichedInventoryItem.status` and `OrderableProduct.status` — so the type system
keeps the filter value out of the badge.

---

## Admin — Dashboard KPI

The headline products number counted templates as stock. It now counts only what the warehouse
actually fulfils, with the rest reported underneath:

```
Orderable products
1,204
2 more catalog-only items
```

`useDashboardStats` runs a second `GET /products?is_orderable=false&limit=1` query
(`['dashboard', 'products-total', { is_orderable: false }]`) and returns `catalogProducts`; the page
fills the `{n}` placeholder in `dashboard.kpi.totalProductsSub` (`'—'` while loading).

---

## API Integration

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/products?is_orderable=true\|false` | Availability filter — admin toolbar, order picker, dashboard counts |
| GET | `/products?stock_status=IN_STOCK` | Live availability — order picker |
| POST | `/products` | `is_orderable?` — admin create (defaults on) |
| PATCH | `/products/:id` | `is_orderable?` — admin edit, and the stock-in "make orderable" step |
| POST | `/orders` | Rejects catalog-only / out-of-stock items with `400` → picker refetch |

---

## i18n Keys (`t.products`)

```jsonc
"toolbar": {
  "allAvailability": "All availability",
  "orderable": "Orderable",
  "catalogOnly": "Catalog only"
},
"table": { "catalogOnly": "Catalog only" },
"form": {
  "orderable": "Available to order from warehouse",
  "orderableHint": "Off = catalog-only listing. Shops can add it to their inventory but can't order it from the warehouse."
}
```

`t.inventory.stockIn.{makeOrderableLabel, makeOrderableHint}` for the stock-in panel, and
`t.dashboard.kpi.totalProducts` / `totalProductsSub` reworded (`"{n} more catalog-only items"`).
AR added for all of them.

---

## Related

- [Admin Products](admin/products.md) · [Admin Inventory](admin/inventory.md)
- [Client Order Page](client/client-order.md) — the picker these filters protect
- [Browse Catalog](client/client-catalog.md) — where catalog-only rows are useful to shops
- [Admin Dashboard](admin/dashboard.md) — KPI split
