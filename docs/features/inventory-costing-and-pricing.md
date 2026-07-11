# Inventory Cost Basis & Selling Price

**Status**: ✅ Complete — backend live, FE integrated
**Type**: Shared inventory enhancement (Client portal · shop owner)
**Created**: 2026-07-10
**Route**: `/client/inventory`
**Assignee**: Melad Adera

---

## Overview

Two related changes that move *money-per-product* off the shared product row and onto the per-`(shop, product)` **inventory** row, so every shop keeps its own cost basis and its own retail price:

- **Cost basis** — a weighted-average `avg_cost`, recomputed on every stock-in.
- **Selling price** — a per-shop `sale_price`, edited from the inventory card.

Both solve the same problem: `products.cost_price` and `products.price` are single values shared across every shop that stocks a product, so one shop couldn't set its own cost or price without changing it for everyone.

### The model

| | Cost | Price |
|---|---|---|
| Catalog / default | `products.cost_price` | `products.price` |
| Per-shop actual | `inventory.avg_cost` | `inventory.sale_price` |
| Seeded | on first stock-in | from `products.price`, seed-once |
| Snapshot on sale | `receipt_items.cost_price` | `receipt_items.price` |

`products.*` become the warehouse list/default. The **inventory row is the source of truth** for what a shop pays and charges. Because the sale snapshots both values, historical receipts stay correct when cost/price later change.

---

## Weighted-average cost (stock-in)

On every stock-in the backend blends the new batch into the running average:

```
newAvg = (oldQty × oldAvg + addQty × unitCost) / (oldQty + addQty)
         (oldQty ≤ 0 → newAvg = unitCost; first batch seeds from product cost)
```

Removing stock (a sale or negative adjust) never changes `avg_cost` — the unit cost of the remaining stock is unchanged by definition.

### `unitCost` — a tri-state contract

`POST /inventory/stock-in` carries an optional `unitCost`. The **key must be omitted** (never `null`/`""`) to invoke the inherit/seed rule:

| Value | Meaning |
|---|---|
| *omitted* | cost inherited (avg unchanged; a new row seeds from product cost) |
| `0` | genuinely free stock (lowers the basis) |
| `> 0` | blended into the average |

The response returns the authoritative recomputed `avg_cost`; the FE reconciles to it.

### Where cost is captured (FE)

- **Bulk stock-in** (`InventorySaveModal`) is the cost-bearing path. It's a multi-product increase, so each increased line has its **own** unit-cost input, **prefilled with the row's current avg** (only when a real basis > 0 exists — avoids sending an accidental `0`). A display-only preview shows `avg 8 → 8.4`, and a non-blocking warning appears when the entered cost deviates > 50 % from the current avg (likely fat-finger).
- **Create product** (`ProductFormModal`) sets initial stock with **no** cost input — a brand-new row hits the seed rule and is valued at the `cost_price` entered on that form.
- **Offline**: each increase captures `unitCost` at enqueue time in the sync queue (`StockSyncItem`), so replay is deterministic. After increases sync, the inventory cache is invalidated so `avg_cost` reconciles.

---

## Per-shop selling price

`inventory.sale_price` is the source of truth for a sale. `products.price` is only the catalog/seed default — **editing a product's price no longer changes what the shop sells at.** The inventory endpoint is the one place to set selling price, uniformly for local *and* warehouse products.

### Where price is edited (FE)

- Each `ProductCard` shows the current selling price with a tap-to-edit affordance → opens `SetPriceModal`.
- `SetPriceModal` prefills the current `sale_price`, shows the catalog default for reference, and computes **live profit-per-unit + margin %** from `avg_cost` (turns red on a loss).
- On save → `PATCH /inventory/:id/price`, then the inventory cache is invalidated. A `403` (row not owned by the shop) surfaces as a toast; the modal keeps the input for retry.
- `ProductFormModal` no longer exposes a price field on **edit** (it only set the catalog default, which does nothing to sales). Price stays on **create** as the seed.

---

## API Integration

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/inventory?limit=100` | Rows now include `avg_cost` (4dp string) and `sale_price` (2dp string) |
| POST | `/inventory/stock-in` | `{ productId, quantity, unitCost?, notes? }` — blends `unitCost` into `avg_cost` |
| PATCH | `/inventory/:id/price` | `{ salePrice }` — shop-owner, own shop only → `403` otherwise; audited |

The cost chain end-to-end:

```
warehouse stock-in (supplier cost) → warehouse.avg_cost
  → order created:  snapshot into order_items.cost_price
  → order received: blend into shop.avg_cost
  → sale:           snapshot into receipt_items.cost_price   (cost)
                    snapshot inventory.sale_price → receipt_items.price   (price)
```

Because profit reports read only the receipt/order snapshots, analytics needed **no** change.

---

## Key Files

| Layer | File | Change |
|---|---|---|
| util | `src/common/utils/money.ts` | `formatMoney` — up to 2dp, trailing zeros trimmed (`25.00` → `25`) |
| types | `src/features/shared/inventory/types/inventory.types.ts` | `avg_cost`, `sale_price`, `StockInInput.unitCost`, `UpdateSalePriceInput` |
| types | `src/features/shop/types/clientInventory.types.ts` | `avg_cost`, `sale_price` on `EnrichedInventoryItem` |
| api | `src/features/shared/inventory/api/inventory.api.ts` | `updateSalePrice` → `PATCH /inventory/:id/price` |
| schema | `src/features/shared/inventory/validations/inventory.schema.ts` | `unitCost` on `stockInSchema`; `updateSalePriceSchema` |
| hook | `src/features/shop/hooks/useClientInventory.ts` | enrich `avg_cost` / `sale_price` |
| offline | `src/features/shared/inventory/offline/stockSyncEngine.ts` | `unitCost` snapshot + replay + reconcile invalidation |
| ui | `src/features/shop/components/inventory/InventorySaveModal.tsx` | per-line cost input, preview, warning; receipt rows show `sale_price` |
| ui | `src/features/shop/components/inventory/SetPriceModal.tsx` | **new** — selling-price editor with live margin |
| ui | `src/features/shop/components/inventory/ProductCard.tsx` | price display + edit affordance |
| ui | `src/features/shop/components/ClientInventoryPage.tsx` | wires cost + price modals, invalidation, 403 handling |
| ui | `src/features/shared/products/components/ProductFormModal.tsx` | price field create-only |

---

## i18n Keys (`t.client.inventory`)

```jsonc
// modal — bulk stock-in cost capture
"unitCostLabel": "Unit cost",
"avgCostLabel": "Avg cost",
"costWarning": "Cost looks unusually far from the current average — double-check.",

// per-shop selling price
"price": "Price",
"priceModal": {
  "title": "Set selling price",
  "priceLabel": "Selling price",
  "catalogDefault": "Catalog default",
  "avgCost": "Avg cost",
  "profitPerUnit": "Profit / unit",
  "margin": "margin",
  "save": "Save",
  "cancel": "Cancel",
  "toastSuccess": "Selling price updated"
}
```

Arabic equivalents added in `src/i18n/ar/client.json`.

---

## Verification

- `tsc --noEmit` clean · `eslint` clean · both `client.json` valid.
- Cost tri-state + blend math and margin/format helpers unit-checked (e.g. `100@5 + 100@7 → 6`; `120@8 + 30@10 → 8.4`; 25 / cost 18 → profit 7, 28 %).
- **Backend prerequisite**: the `inventory` schema migrations must be applied — `01-InventoryAvgCost.sql` (avg_cost) and `02-InventorySalePrice.sql` (sale_price). If `PATCH /inventory/:id/price` 500s with *"column sale_price does not exist"*, run `npm run migration:run` in the backend repo.

---

## Related

- [Offline PWA (Client Inventory)](offline-pwa.md) — the sync queue that carries `unitCost`
- [Profit Dashboard](profit-dashboard.md) — consumes the cost/price snapshots
- [Client Inventory](client/client-inventory.md) — the page these features live on
