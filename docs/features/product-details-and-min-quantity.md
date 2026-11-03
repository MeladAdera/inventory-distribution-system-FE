# Product Details Panel & Per-Shop Minimum Quantity

**Status**: ✅ Phase 1 complete — FE integrated and verified against the real API (production build)
**Type**: Client portal · shop inventory (shop owner edits, employee read-only)
**Created**: 2026-11-01
**Last Updated**: 2026-11-04
**Route**: `/client/inventory`
**Assignee**: Melad Adera

---

## Overview

A shop owner can now set their own **minimum quantity** (low-stock threshold) for any product,
including products added from the warehouse catalog. Tapping a product card opens a
**details panel** that holds the product's full details and every per-shop setting, so new
settings no longer have to be squeezed onto the card.

The panel replaces `SetPriceModal`: the selling price is edited there too, next to the new
minimum quantity, and both are saved with one button.

### Why per shop

The threshold was always stored per shop — it is `inventory.low_stock_threshold` on the shop's
own row, not a column on the shared product. Changing it in Shop A does not affect Shop B or the
warehouse, even for the same catalog product. What was missing was a way to change it.

---

## Backend contract

```
PATCH /inventory/:id/threshold
{ "lowStockThreshold": 5 }
```

| | |
|---|---|
| `:id` | The **inventory row id** (`item.id` on the card), not the product id |
| Who | `SHOP_OWNER` (own shop only, `403` otherwise) or `WAREHOUSE_ADMIN`. `EMPLOYEE` → `403` |
| Values | Whole number, `0` – `1,000,000`. `0` = alert only when the item is out of stock |
| Errors | `400` (missing, negative, decimal, too large) · `403` · `404` unknown id |
| Response | The updated row, with `is_low_stock` recalculated. It shows up in `GET /inventory/low-stock` immediately |
| Audit | `INVENTORY` / `THRESHOLD_CHANGE`, note "Minimum quantity: 10 → 5" (EN + AR) |

An item is low stock when `current_quantity <= low_stock_threshold`. The selling price keeps its
own endpoint, `PATCH /inventory/:id/price` (see
[inventory-costing-and-pricing.md](inventory-costing-and-pricing.md)).

---

## What the user sees

### The card

The card layout is unchanged — photo, name, status badge, quantity, the +/− stepper and
**Order more**. The selling price is still shown, but without the pencil.

Tapping the **photo**, the **name** or the **price row** opens the panel. The stepper and
Order more keep their own behaviour, so adjusting stock never opens the panel by accident.
The name is the keyboard / screen-reader entry point; the photo is a pointer-only shortcut
(`tabIndex={-1}`, `aria-hidden`).

The Edit / Delete icons for the shop's own products are still on the card (phase 2 moves them
into the panel).

### The panel

Built on the shared `Drawer`: a side panel on the inline-start edge from `sm` up (right in
Arabic, left in English), a bottom sheet on phones.

```
┌ Product name ──────────────────── × ┐
│ [photo]                              │
│ ● Enough               Current qty 25│
│ Category ............ Groceries      │
│ Source .............. Warehouse catalog / My product
│ Barcode ............. 6281234…       │  (when set)
│ Description ......... …              │  (when set)
│ ── Shop settings ─────────────────── │
│ Selling price   [ 40          ]      │
│   Catalog default 40 · Avg cost 30   │
│   Profit / unit 10 (25% margin)      │
│ Minimum quantity [ 10         ]      │
│   Shown as low stock when the qty is │
│   at or below this. 0 = only when out│
├──────────────────────────────────────┤
│                    [Cancel]  [Save]  │
└──────────────────────────────────────┘
```

- **Inputs start empty** with the current value as the placeholder (same rule as the old price
  modal). A field left empty is not changed.
- **Live margin** follows the typed price, or the current selling price while the field is empty.
- **Validation** — price must be above 0 with at most 2 decimals; minimum quantity accepts digits
  only (Arabic-Indic digits are converted as you type, letters and `-` are ignored) and must be
  ≤ 1,000,000. Invalid input shows an inline message and disables Save.
- **Save is enabled only when something actually changed** — a value equal to the current one
  does not count.

### Who can edit

| Role | Panel |
|---|---|
| `SHOP_OWNER` | Editable price + minimum quantity, pricing reference (catalog default, avg cost, margin), Save |
| `EMPLOYEE` | Read-only: values as text, a note that only the owner can change them, no cost/margin, no Save |

Previously employees saw the price button on the card and got a `403` when they used it.

### Offline

These edits go straight to the server — they are **not** queued like stock changes. While
offline (`useOnlineStatus`), Save is disabled and the footer explains why.

---

## Save behaviour

`useInventoryItemSettings().saveSettings({ id, changes })` sends **only the fields that changed**:

| Changed | Calls |
|---|---|
| Price only | `PATCH /inventory/:id/price` |
| Minimum quantity only | `PATCH /inventory/:id/threshold` |
| Both | Both, in parallel |

- Both calls run with `Promise.allSettled`, so if one fails the other still lands, and the error
  is reported only after both finish.
- On success: toast "Changes saved", panel closes.
- On failure: the server's message is shown as a toast (incl. `403`), the panel stays open and
  keeps what was typed. Because the panel compares against the **refetched** row, a retry
  resends only the half that failed.
- After every save (success *or* partial failure) the hook invalidates:
  - `['client-inventory']` — card badge, card price, and the client dashboard's low-stock list
  - `['inventory', 'low-stock']` — the shortages view

The page keeps the open item as an **id** (`detailsId`) and looks it up in `allItems`, so the
panel always shows the refetched row rather than a stale snapshot.

---

## Overlay layering fix

Testing showed the client top bar (`sticky z-100`) painting over the panel: it hid the panel's
× in Arabic and was not dimmed by the overlay. `Drawer` and `Modal` both used `z-50`; a centred
modal mostly hid the problem, a full-height side panel does not.

| Element | Before | After |
|---|---|---|
| `Drawer` (`src/common/components/Drawer.tsx`) | `z-50` | `z-110` — above the top bars |
| Toasts (`src/providers/ToastProvider.tsx`) | `z-50` | `z-120` — an error raised from an open drawer stays visible |

`ShiftDrawer` (the only other `Drawer` user) does not open anything on top of itself, so it is
unaffected. `Modal` is still `z-50` — see *Known limits*.

---

## Key files

| Layer | File | Change |
|---|---|---|
| types | `src/features/shared/inventory/types/inventory.types.ts` | `UpdateLowStockThresholdInput` |
| api | `src/features/shared/inventory/api/inventory.api.ts` | `updateLowStockThreshold` → `PATCH /inventory/:id/threshold` |
| schema | `src/features/shared/inventory/validations/inventory.schema.ts` | `updateLowStockThresholdSchema`, `MAX_LOW_STOCK_THRESHOLD` |
| types | `src/features/shop/types/clientInventory.types.ts` | `description` on `EnrichedInventoryItem`; `InventoryItemSettingsChanges` |
| hook | `src/features/shop/hooks/useClientInventory.ts` | enrich `description` from the product |
| hook | `src/features/shop/hooks/useInventoryItemSettings.ts` | **new** — price + threshold save, invalidation |
| ui | `src/features/shop/components/inventory/ProductDetailsDrawer.tsx` | **new** — the panel |
| ui | `src/features/shop/components/inventory/ProductCard.tsx` | `onOpenDetails`; price row read-only; photo/name open the panel |
| ui | `src/features/shop/components/inventory/SetPriceModal.tsx` | **removed** — folded into the panel |
| ui | `src/features/shop/components/ClientInventoryPage.tsx` | `detailsId` state, owner-only editing, online status, wires the panel |
| ui | `src/common/components/Drawer.tsx` | `z-50` → `z-110` |
| ui | `src/providers/ToastProvider.tsx` | `z-50` → `z-120` |
| types | `src/features/admin/audit-logs/types/audit-logs.types.ts` | `PRICE_CHANGE`, `THRESHOLD_CHANGE` on `AuditLogAction` (labels come from the backend's `action_label`) |

---

## i18n keys (`t.client.inventory.details`)

Replaces `t.client.inventory.priceModal`. EN in `src/i18n/en/client.json`, AR in
`src/i18n/ar/client.json`.

```jsonc
"details": {
  "category": "Category",            // الفئة
  "barcode": "Barcode",              // الباركود
  "description": "Description",      // الوصف
  "source": "Source",                // المصدر
  "sourceWarehouse": "Warehouse catalog", // كتالوج المستودع
  "sourceOwn": "My product",         // منتجي
  "shopSettings": "Shop settings",   // إعدادات المتجر
  "shopSettingsHint": "These apply to your shop only.",
  "readOnly": "Only the shop owner can change these.",
  "salePrice": "Selling price",
  "catalogDefault": "Catalog default",
  "avgCost": "Avg cost",
  "profitPerUnit": "Profit / unit",
  "margin": "margin",
  "errPrice": "Enter a price above 0 with up to 2 decimals.",
  "minQty": "Minimum quantity",      // الحد الأدنى للكمية (matches the backend audit label)
  "minQtyHint": "Shown as low stock when the quantity is at or below this. 0 = only when out of stock.",
  "errMinQty": "Enter a whole number from 0 to 1,000,000.",
  "offline": "You're offline. Connect to save changes.",
  "save": "Save",
  "cancel": "Cancel",
  "toastSuccess": "Changes saved"
}
```

The status labels and "Current quantity" reuse the existing `t.client.inventory` keys.

---

## Verification (2026-11-04)

Run against the real backend (`:3001`) and the **production build** (`next build --webpack`,
`next start` on `:3000`), on a throwaway test shop with its own owner and employee. The test shop
and everything it created were deleted afterwards; no row outside it was touched.

**API** (curl): employee → `403` on both endpoints; owner on the warehouse's row → `403`;
`1.5`, `-1`, `1000001` → `400`; `1000000` → `200`; unknown id → `404`.

**Browser** (Playwright, 61 checks, all passing):

- Card opens the panel from the photo, name and price row; the stepper does not.
- Raising the minimum above stock flips the badge to Low without a reload; the client
  dashboard lists the item; lowering it to `0` flips it back. The warehouse row for the same
  product stayed at `10`.
- Price only / minimum only / both each send exactly the expected `PATCH` calls.
- Validation messages, digit-only input, Arabic digits, unchanged values keep Save disabled;
  Escape closes; reopening starts empty; focus survives typing.
- Simulated price `500` with a real threshold save: error toast above the panel, panel stays
  open, threshold saved, retry sends only the price.
- Simulated `403` shows its message. Offline disables Save with the note.
- Own product shows "My product", barcode, description; catalog product shows "Warehouse catalog".
- English (LTR) and Arabic (RTL) layouts; the × is never covered by the top bar or sidebar.
- Phone: full-width bottom sheet, no horizontal scroll.
- Employee: no inputs, no Save, no cost/margin, no `PATCH` sent.
- Audit log page shows "Minimum Quantity Change".

---

## Known limits / next

- **Phase 2** — move Edit (opens the existing `ProductFormModal`) and Delete for the shop's own
  products from the card into the panel, then remove those icons from the card.
- **Modal stacking** — `Modal` and `ProductFormModal` are still `z-50`, under the top bar (an
  existing issue on every page). When phase 2 opens `ProductFormModal` from the panel it must
  sit above the drawer (`z-110`), so both should move to the same overlay layer then.
