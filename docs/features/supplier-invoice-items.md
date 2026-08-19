# Supplier Invoice Items (Buy → Stock)

**Status**: ✅ Phase 1 complete — backend live, FE integrated and verified against the real API
**Type**: Shared suppliers enhancement (Client portal · shop owner, and admin)
**Created**: 2026-08-19
**Last Updated**: 2026-08-19
**Routes**: `/client/suppliers` (shop owner) · `/suppliers` (warehouse admin) — same component
**Assignee**: Melad Adera

---

## Overview

Recording a supplier bill used to be money-only: a total, what was paid, an optional invoice
number. Putting the goods that arrived onto the shelf was a **separate** trip through
`POST /inventory/stock-in`, once per product, with nothing tying the stock to the bill it came
from.

`POST /suppliers/:id/debts` now accepts an optional **`items[]`**. Every line is stocked into
the shop's inventory at its invoice unit cost, **in the same database transaction as the bill**.
One request, or nothing at all — there is no partial outcome.

Nothing existing breaks. `items` is optional, and a bill sent without it behaves exactly as
before and comes back with `items: []`. Bills for rent, delivery charges or services keep
omitting it.

### Why it matters

The two facts were previously recorded in two places with no link between them, so the money
ledger and the stock ledger could drift with nothing to reconcile against. Now one action
records both, and each bill knows exactly which inventory rows it moved.

---

## Endpoints

| Method | Path | Change |
|---|---|---|
| `POST` | `/suppliers/:id/debts` | **extended** — optional `items[]` |
| `GET` | `/suppliers/:id/debts/:debtId/items` | **new** — the goods on one bill |

Roles unchanged: `WAREHOUSE_ADMIN` and `SHOP_OWNER` only. `EMPLOYEE` gets `403` on both, and
neither portal's nav nor the middleware allowlist offers the route.

### Request

```jsonc
POST /suppliers/5/debts
{
  "totalAmount": "1420.00",
  "paidAmount":  "400.00",
  "invoiceNo":   "INV-882",
  "items": [                    // optional; omit for a bill with no goods
    { "productId": 146, "quantity": 21, "unitCost": "50.00" },
    { "productId": 127, "quantity": 10, "unitCost": "20.00" }
  ]
}
```

**Money is a string, everywhere** — `"50.00"`, not `50.0`. The backend compares in exact minor
units, and floats lose cents at scale. Max 200 lines per bill.

### Response

`201` returns the debt plus the lines it stocked. Each line carries the two numbers worth
showing together:

| Field | Meaning |
|---|---|
| `unit_cost` | what this delivery charged, 4dp |
| `line_total` | `quantity × unit_cost`, 2dp, computed by the DB |
| `avg_cost` | the cost basis **after** this purchase blended in |
| `sale_price` | the shop's current selling price — **unmoved** by the purchase |
| `inventory_id` | the row this line stocked; the target for `PATCH /inventory/:id/price` |

`GET …/items` returns the same array with `avg_cost` and `sale_price` read **live**, so an
invoice reopened next month shows today's cost basis rather than the one this delivery produced.

---

## The derived total

The backend requires `Σ (quantity × unitCost) === totalAmount` **exactly**, with no tolerance.
The handoff suggested collecting a typed total and blocking submit until a running sum agreed
with it.

**We derive the total from the lines instead.** In goods mode the total field is not rendered at
all — `BillItemsTable` states the sum, and that is what gets submitted. This makes the single
commonest rejection structurally unreachable rather than something the user reconciles by hand,
where every mismatch is a dead end with no guidance about which side is wrong.

### Consequence: no tax / shipping / discount

Because the lines must sum to the total exactly and there are no `taxAmount` / `shippingAmount`
fields on the API, an invoice with VAT or a delivery charge on top **cannot be entered as one
itemised bill**. The form says so directly, under the total:

> VAT or a delivery charge on top? Fold it into the unit prices, or record it as a separate bill
> with no goods.

Folding a charge into unit costs slightly distorts `avg_cost`; the separate-bill route keeps the
cost basis honest but splits one paper invoice across two records. The backend team's position
is that the fix is explicit fields, not loosening the sum rule. **Raise it with them if this
starts blocking real use.**

---

## Rules the frontend enforces

All of these are enforced server-side too, but catching them in the form beats a rejected
submit — every one of these rejects the **whole** request, writing nothing.

| Rule | Where | How |
|---|---|---|
| Lines sum to the total | — | satisfied by construction; the total *is* the sum |
| `unitCost > 0` | `useBillDraft` | `isValidMoneyInput` is "> 0 and ≤ 2dp", so one check covers empty, malformed and zero |
| No duplicate `productId` | `useBillDraft` | picking a product already on a line **merges** — quantity +1 and the row flashes |
| `quantity ≥ 1` | `useBillDraft` | |
| ≤ 200 lines | `useBillDraft` | `BILL_ITEMS_MAX`; the table says so when full |
| `paidAmount ≤ totalAmount` | `RecordBillModal` | mirrors `400 supplier.PAID_EXCEEDS_TOTAL` |
| Supplier is active | picker | deactivated suppliers were never offered |

The duplicate rule is a **merge, not an error**: two lines for the same product is a `400`, and a
repeat pick almost always means "one more of these" rather than "a second entry" — so the merge
is both the correct payload and the likely intent.

All arithmetic goes through the minor-unit helpers in `src/common/utils/money.ts`
(`parseMoney`, `multiplyMoney`, `sumMoney`, `compareMoney`). Adding line totals as floats drifts
by a fraction of a unit, and the server compares in exact cents.

### Server errors the form surfaces

| Status | Meaning |
|---|---|
| `400` | lines don't sum to the total (names both figures) |
| `400` | same product on more than one line |
| `400` | unit price not > 0 (names the product) |
| `400` | `paidAmount` exceeds the total |
| `403` | product isn't available to this shop |
| `404` | product doesn't exist (names the id) |
| `409` | `invoiceNo` already used for this supplier |

All localized server-side and rendered inline by `getErrorMessage`. Safe to retry the same
payload once corrected.

---

## Adding a product that doesn't exist yet

A line takes a `productId` and **cannot create a product** — a product needs a category and a
*selling* price, and nothing on an invoice line can derive what you sell for from what you paid.
So a delivery containing something new used to be a dead end: leave the form, go to Products,
create it, come back, start over.

`ProductPicker` now offers a **＋ New product** row, opening `QuickProductModal`:

```
POST /products  { name, category_id, price, cost_price, barcode? }  →  { id }
   ↓  id + name + buying price
line added to the draft with unitCost prefilled
```

**Why not `ProductFormModal`.** That form carries an image uploader, a description, an orderable
toggle and an **opening-quantity** field. The first three are noise while a delivery is standing
in the doorway; the last is actively wrong here — the bill line is about to stock the product, so
an opening balance would count the same delivery twice.

**Asking the buying price does double duty**: it sets `cost_price` so the catalog starts out
honest, and it prefills the line's unit cost, so the number is typed once. A live margin readout
sits between the two prices and turns red when the buying price meets or exceeds the selling one.

**Created immediately, not deferred.** If the bill is then rejected the product stays behind —
but it is a real product the shop genuinely stocks, listed with no stock, deletable from the
Products page. Deferring creation to submit would not avoid this: a create-then-post chain fails
in exactly the same place, only with ids the user can no longer see.

---

## What happens to inventory

Handled entirely by the backend; useful for helper text.

| Situation | Result |
|---|---|
| Shop already stocks the product | quantity increases; `avg_cost` becomes the **weighted average** of old stock and the new batch |
| Product in the catalog, no stock row | row created: `avg_cost` = invoice price, `sale_price` = the catalog's `price` |
| Row exists but quantity is 0 | `avg_cost` resets cleanly to the new price; the old average is discarded |

```
newAvg = (currentQty × currentAvg + buyQty × buyCost) / (currentQty + buyQty)
```

Identical to the calculation manual stock-in has always used — see
[Inventory Cost Basis & Selling Price](inventory-costing-and-pricing.md).

### FE consequence: cache invalidation

Recording a bill now **moves stock**, so `useSupplierDetail`'s `recordBill` mutation invalidates
`['inventory']` and `['products']` alongside `['suppliers']` and `['analytics']`. Without it the
inventory page keeps showing pre-delivery quantities until something else happens to refetch.
Easy to drop in a refactor; the symptom is stale stock after a delivery.

---

## Cancelling

`POST /debts/:id/cancel` still works for bills **without** items.

A bill **with** items cannot be cancelled at all — it already moved goods onto the shelf, and
voiding the money while the stock stays put would desync the two. `BillDetailModal` fetches the
items and **withholds** the button with an explanation rather than letting the user hit the 400.

`useBillItems` returns `hasItems` as `boolean | null`, where `null` means "not loaded yet". The
cancel action requires an explicit `false`, so the button never appears and then vanishes.

> ⚠️ **There is no "cancel and restock" path.** Undoing a mis-entered itemised bill means an
> inventory adjustment plus a manual write-off — the money and the stock corrected in two
> unlinked places. This is the most likely gap to come back as a complaint from real use.

---

## Architecture

```
src/features/shared/suppliers/
├── types/suppliers.types.ts     BillItemInput · BillItem · BillWithItems · BILL_ITEMS_MAX
├── api/suppliers.api.ts         recordBill (extended) · billItems (new)
├── hooks/
│   ├── useBillDraft.ts          ← line state + every client-side rule (no server state)
│   ├── useBillItems.ts          ← GET one bill's goods; hasItems: boolean | null
│   └── useSupplierDetail.ts     ← recordBill mutation + the widened invalidation
└── components/
    ├── RecordBillModal.tsx      ← mode switch, orchestrates the draft
    ├── BillItemsTable.tsx       ← the lines + the derived total
    ├── BillItemRow.tsx          ← one line: name, qty, unit cost, line total
    └── BillDetailModal.tsx      ← goods table + cancel gating

src/features/shared/products/components/
├── ProductPicker.tsx            ← debounced server-side catalog search (reusable)
└── QuickProductModal.tsx        ← slim create form with live margin
```

### One modal, two modes

`RecordBillModal` carries a segmented switch at the top:

| Mode | Sends | For |
|---|---|---|
| **Bill only** | no `items` key | rent, delivery charges, services — anything with nothing to shelve |
| **Bill + goods** | `items[]` | a delivery |

The choice leads the form because it changes what the rest of it asks for. Typed values survive
the switch. `items` is **omitted entirely** in money mode — an empty array would still read as
"a delivery that brought nothing".

The modal grows to `size="xl"` in goods mode, which is what added the `xl` (`max-w-3xl`) option
to `src/common/components/Modal.tsx`.

### `ProductPicker` — inline results, not a dropdown

Results render **inline, directly beneath the field**, not in a floating panel. Both callers live
inside a scrolling modal where an absolutely positioned dropdown gets clipped by the dialog's
`overflow-hidden`; pushing content down instead is simpler and immune to it.

The search is server-side (`GET /products?search=&is_active=true`, debounced 300 ms, 8 results)
because a catalog is not a list you can hold in a `<select>` — rendering every product as an
option means fetching the whole book to pick one thing out of it.

In the bill form the picker sits **above** the table rather than inside each row: a row-level
dropdown would clip, and searching-then-adding matches how a delivery is actually entered.

An optional `source` prop narrows the search — the admin stock-in flow passes `WAREHOUSE`,
because a shop's local product is not something the warehouse can put on its own shelves.

**Also adopted by** `StockInModal` on `/inventory`, which previously fetched up to 999 warehouse
products on every page visit to populate a `<select>` — see
[Admin Inventory](admin/inventory.md).

---

## i18n

Under `t.debts.suppliers.bill` (`src/i18n/{en,ar}/debts.json`):

```jsonc
"modeMoney": "Bill only",
"modeGoods": "Bill + goods",
"modeMoneyHint": "For rent, delivery charges, or anything else with nothing to put on the shelf.",
"modeGoodsHint": "Adds the products to your stock at the price you paid, as part of the same bill.",
"goodsTitle": "What arrived",
"taxHint": "VAT or a delivery charge on top? Fold it into the unit prices, or record it as a separate bill with no goods.",
"items": {
  "quantity": "Qty", "unitCost": "Unit cost", "lineTotal": "Line total", "remove": "Remove line",
  "errQuantity": "Enter a quantity of at least 1.",
  "errCost": "Enter a unit cost greater than 0.",
  "empty": "Nothing added yet — search above to add the first product.",
  "computedTotal": "Invoice total", "computedTotalHint": "Added up from the lines above.",
  "lineCount": "{n} products", "full": "That's the most products one bill can carry (200)."
}
```

Under `t.debts.suppliers.billDetail`: `cancelBlocked` plus a `goods` bundle.
Under `t.products`: new `picker` and `quickCreate` bundles (`src/i18n/{en,ar}/products.json`).

Arabic added alongside English in the same change, per the project convention. EN/AR key parity
verified programmatically.

---

## Verification

- `tsc --noEmit` clean · `eslint` 0 errors · `next build` compiled successfully.
- EN/AR key parity checked by script across `debts.json`, `products.json`, `inventory.json`.
- Walked against the **live backend** (`http://localhost:3001`) by the user and confirmed working
  — unlike the original supplier-debts phases, which were type-checked only.

Manual checklist:

1. **Bill-only mode unchanged** — the regression that matters most, since the form now branches.
2. **Bill + goods** — 21 × *gff* @ 50.00, 10 × *بسكوتة 5000* @ 20.00, 5 × *rubbi* @ 34.00, pay
   400.00. Total computes to 1,420.00 with no typing; result is `PARTIAL`, `remaining "1020.00"`.
3. **Inventory reflects it without a hard refresh** — *gff* reads 50 units at `avg_cost` 46.5200,
   the weighted average of 29 @ 44 and 21 @ 50.
4. **Duplicate merge** — picking the same product twice bumps the quantity and flashes the row.
5. **Zero cost** — submit stays disabled with the line flagged.
6. **New product** — created, lands in the line with `unitCost` prefilled, bill posts.
7. **Cancel gating** — a bill with items offers no Cancel; one without still does.
8. **Arabic / RTL** — table and quick-create in RTL; money stays Latin digits and `tabular-nums`.

---

## Not built yet — Phase 2

The handoff's §10 payoff, deliberately deferred so the buy→stock flow could be tested alone.
Every field it needs is already typed on `BillItem` and returned by the API, so it is purely
additive:

> After a bill posts, swap the modal body for a "what this delivery changed" panel — each line's
> new `avg_cost` against its `sale_price` with a margin %, flagging anything thin or negative, and
> a "fix the price" shortcut calling `PATCH /inventory/:id/price` via each line's `inventory_id`.

Nothing moves a selling price when cost moves. A supplier raises their price, `avg_cost` climbs
toward `sale_price`, and the margin quietly disappears — this prompt is the only thing that would
catch it.

### Open gaps with the backend

| Gap | Impact |
|---|---|
| No `taxAmount` / `shippingAmount` | an invoice with VAT or delivery can't be one itemised bill |
| No "cancel and restock" | a mis-entered itemised bill can only be undone in two unlinked places |

---

## Related

- [Inventory Cost Basis & Selling Price](inventory-costing-and-pricing.md) — the weighted-average
  `avg_cost` these lines feed, and the `sale_price` Phase 2 compares against
- [Admin Inventory](admin/inventory.md) — `StockInModal`, the other `ProductPicker` caller
- [Products](admin/products.md) — the catalog `QuickProductModal` writes into
- [Catalog-only vs. Orderable Products](catalog-vs-orderable.md) — `is_orderable`, which the
  quick-create form deliberately doesn't ask about
