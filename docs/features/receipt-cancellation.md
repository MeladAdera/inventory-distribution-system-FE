# Receipt Cancellation

**Status**: ✅ Complete (real API integrated)
**Type**: Shared receipts enhancement — admin portal + client portal
**Created**: 2026-07-25
**Routes**: `/receipts` (admin) · `/client/receipts` (shop owner / employee)
**Assignee**: Melad Adera

---

## Overview

A sale can be entered wrongly — wrong product, wrong quantity, customer walks back in. Cancelling a
receipt is the undo:

- the receipt's items go **back into stock**,
- the receipt stops counting toward sales and profit,
- the record itself is **kept**, flagged `is_cancelled`, with an optional reason and a timestamp.

Nothing is deleted — an audited paper trail of what was voided and why is the whole point. The
action is **one-way**: there is no un-cancel, so the confirm dialog says so explicitly.

Available from the receipt detail modal on both portals — `ReceiptDetailModal` lives in
`src/features/shared/receipts/`, so admin and client got the feature from a single implementation.

---

## File Structure

```
src/features/shared/receipts/
├── types/receipts.types.ts        ← + is_cancelled / cancelled_at / cancelled_by / cancel_reason
│                                    + CancelReceiptInput, CANCEL_REASON_MAX_LENGTH
├── api/receipts.api.ts            ← + cancel(id, reason?, config?)
├── hooks/useReceipts.ts           ← useReceiptDetail: + cancelReceipt / isCancelling
├── components/
│   ├── CancelReceiptModal.tsx     ← new — reason textarea + danger confirm
│   └── ReceiptDetailModal.tsx     ← cancelled badge + cancel details panel + Cancel button
└── index.ts                       ← exports CancelReceiptModal, CancelReceiptInput, CANCEL_REASON_MAX_LENGTH

src/features/admin/receipts/components/AdminReceiptsTable.tsx  ← struck-through id + cancelled pill
src/features/shop/components/receipts/ReceiptsTableCard.tsx    ← cancelled pill (desktop + mobile)
src/i18n/{en,ar}/receipts.json                                 ← t.receipts.modal.*
src/i18n/{en,ar}/client.json                                   ← t.client.receipts.modal.*
```

---

## Data Flow

```
ReceiptDetailModal  — "Cancel receipt" button (hidden once receipt.is_cancelled)
      ↓  setCancelOpen(true)
CancelReceiptModal  — optional reason, max 500 chars, live counter
      ↓  onConfirm(reason?)
useReceiptDetail().cancelReceipt(reason)
      ↓  PATCH /receipts/:id/cancel   body: { reason } — or {} when left blank
      ↓  onSuccess → invalidate ['receipts'] + ['inventory'] + ['analytics']  (refetchType: 'all')
      ↓  toast "Receipt cancelled — stock returned", cancel dialog closes
      ↓  detail modal re-renders from the refetched receipt: cancelled badge + reason panel
```

Three caches are invalidated because a cancellation is not a receipts-only event: the items are
restocked (`['inventory']`) and the receipt drops out of the profit figures (`['analytics']`).

---

## Types

```ts
interface Receipt {
  // …
  is_cancelled: boolean;
  /** Cancel metadata — detail endpoint only, null while the receipt is active */
  cancelled_at: string | null;
  cancelled_by: number | null;   // id only — no name is joined, so the UI shows date + reason
  cancel_reason: string | null;
}

interface ReceiptListItem {
  // …
  is_cancelled: boolean;         // list rows carry the flag, not the metadata
}

interface CancelReceiptInput {
  /** Optional, max 500 chars — omitted entirely when the user leaves it blank */
  reason?: string;
}

export const CANCEL_REASON_MAX_LENGTH = 500;
```

The constant is exported from the barrel so the modal's `maxLength` and counter can never drift from
the API contract.

---

## `CancelReceiptModal`

A small purpose-built dialog rather than a reuse of `Modal`, for two reasons:

- **No body-scroll lock.** It opens *on top of* `ReceiptDetailModal`, which already holds the lock;
  locking twice means the first close releases it and the page scrolls behind the still-open modal.
- Danger-dialog layout: warning triangle in a `danger-100` tile, title + irreversibility warning,
  reason textarea, then `Cancel receipt` (danger) / `Keep it` (outline).

Behaviour:

| Detail | Value |
|---|---|
| Reason | Optional. `reason.trim() || undefined` → the key is **omitted** when blank, never sent as `""` |
| Counter | `{n} / 500`, `maxLength` enforced by the textarea |
| Reset | `useEffect` clears the draft on each open so a previous receipt's reason can't leak |
| In-flight | Both buttons disabled, spinner replaces the ban icon |
| On error | Dialog **stays open** (toast shows the backend message) so the typed reason survives a retry |

---

## Cancelled receipt presentation

**Detail modal** — a cancelled receipt is frozen:

```
Date: 25 Jul 2026   Created by: Yazan   [ Cancelled ]        ← danger pill with Ban icon
┌──────────────────────────────────────────────┐
│ Cancelled on 25 Jul 2026                     │            ← danger-tinted panel
│ Reason: Customer changed their mind          │
└──────────────────────────────────────────────┘
… items table (unchanged, still shows what was sold) …
                                     [ Close ]              ← no free toggle, no second cancel
```

Both footer actions (`Make free` / `Undo free` **and** `Cancel receipt`) are rendered only when
`!receipt.is_cancelled` — a voided receipt has no free status worth toggling and cannot be cancelled
twice (the backend rejects it with `receipt.ALREADY_CANCELLED` anyway).

**List rows** — `is_cancelled` shows as a red pill next to the receipt number:

| Surface | Treatment |
|---|---|
| `AdminReceiptsTable` | Receipt `#id` gets `line-through text-gray-400` + red "Cancelled" pill |
| `ReceiptsTableCard` (desktop row) | Red "Cancelled" pill after the date/time |
| `ReceiptsTableCard` (mobile card) | Red "Cancelled" pill next to the receipt-number chip |

Both pages pass their whole `modal` i18n object (`t.receipts.modal` / `t.client.receipts.modal`) to
`ReceiptDetailModal`, so both got the cancel copy with no per-page wiring beyond the new
`cancelledBadge` label the tables needed.

---

## API Integration

| Method | Endpoint | Body | Notes |
|---|---|---|---|
| PATCH | `/receipts/:id/cancel` | `{ reason? }` | Restocks items, excludes the receipt from sales/profit, writes `cancelled_at` / `cancelled_by` / `cancel_reason` |

Backend errors surface through `getErrorMessage(err)` as a toast — the envelope's localized
`message` is shown as-is (e.g. `receipt.ALREADY_CANCELLED`).

---

## i18n Keys

Same key set under `t.receipts.modal` (admin) and `t.client.receipts.modal` (client — worded in
second person, "your stock", "your sales and profit"):

```jsonc
"cancelledBadge": "Cancelled",
"cancelledOn": "Cancelled on",
"cancelReasonLabel": "Reason",
"cancelBtn": "Cancel receipt",
"cancelSuccess": "Receipt cancelled — stock returned",
"cancelModal": {
  "title": "Cancel receipt",
  "warning": "The items go back into stock and this receipt stops counting toward sales and profit. This cannot be undone.",
  "reasonLabel": "Reason (optional)",
  "reasonPlaceholder": "e.g. Customer changed their mind",
  "confirmBtn": "Cancel receipt",
  "keepBtn": "Keep it"
}
```

AR equivalents added in `src/i18n/ar/receipts.json` and `src/i18n/ar/client.json`.

---

## Shipped alongside

Small changes made in the same pass, both about reading receipts on a phone:

- **Time next to the date** in `ReceiptsTableCard` (desktop row and mobile card) — with several
  sales a day, a date alone doesn't identify a receipt. `formatTime` uses the same
  `ar-SY-u-nu-latn` locale convention as `formatDate`.
- **Product name over thumbnail** in the detail modal on mobile: `ProductThumb` and the
  `Before` / `After` columns are `hidden sm:*`, leaving name · consumed · price — the three columns
  that matter — readable on a narrow screen.
- **Employees can reach `/client/receipts`** (`EMPLOYEE_ALLOWED_ROUTES` + `EMPLOYEE_NAV_IDS`), and
  the admin receipts page no longer redirects employees away; permission is enforced by the backend
  and by role-scoped queries.

---

## Related

- [Client Receipts](client/client-receipts.md) — the shop-owner receipts page
- [Quick Sell](client/client-sell.md) — where most receipts come from
- [Profit Dashboard](profit-dashboard.md) — reads the sales figures a cancellation removes
- [Inventory Cost Basis & Selling Price](inventory-costing-and-pricing.md) — the snapshots a receipt carries
