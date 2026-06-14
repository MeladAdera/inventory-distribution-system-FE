# Feature: Transfers Admin Page (FIGMA-005)

**Status**: Mock Data — UI Complete  
**Created Date**: 2026-06-14  
**Last Updated**: 2026-06-14  
**Assignee**: Melad Adera  
**Ticket**: FIGMA-005

---

## 📋 Overview

### Purpose
The Transfers admin page (`/transfers`) is the central hub for recording and reviewing stock movements from the warehouse to clients. Each transfer deducts a quantity from a product's available stock and logs the client, product, quantity, date, and who recorded it.

### Business Value
- Full audit trail of every stock transfer per client and product
- Client + product filter dropdowns for fast lookup
- Shared `TransferModal` usable from the Dashboard and Shortages page via `prefill` prop
- Real-time availability banner in the modal (green = OK, red = exceeds stock) prevents over-transfers
- Bilingual (AR/EN) with full RTL/LTR support

---

## 🏗️ Architecture

### File Structure

```
src/features/transfers/
├── components/
│   ├── TransfersTableCard.tsx      # Table card: toolbar + 6-col CSS grid + skeleton + mobile cards
│   └── TransferModal.tsx           # Shared new-transfer form modal with availability banner
├── mock/
│   └── transfersData.ts            # 8 MOCK_TRANSFERS + 6 MOCK_TRANSFER_CLIENTS + 12 MOCK_TRANSFER_PRODUCTS
├── types/
│   └── transfers.types.ts          # Transfer, TransferProduct, TransferClient, TransferPrefill
└── index.ts                        # Barrel export

src/app/(dashboard)/transfers/page.tsx   # Page — state, filter, mock CRUD, toast on save
src/i18n/en/transfers.json               # English translations
src/i18n/ar/transfers.json               # Arabic translations
```

---

## 🧩 Type Reference

### `Transfer`
```ts
interface Transfer {
  id: number;
  date_ar: string;          // "٢٠٢٦/٠٥/٣٠"  (Eastern Arabic numerals)
  date_en: string;          // "30 May 2026"
  client_id: number;
  client_name_ar: string;
  client_name_en: string;
  product_id: number;
  product_name_ar: string;
  product_name_en: string;
  qty: number;
  notes_ar: string;
  notes_en: string;
  recorded_by_ar: string;   // Always "سالم المنصوري"
  recorded_by_en: string;   // Always "Salem Al Mansoori"
}
```

### `TransferProduct`
```ts
interface TransferProduct {
  id: number;
  name_ar: string;
  name_en: string;
  available_qty: number;
  is_active: boolean;
}
```

### `TransferClient`
```ts
interface TransferClient {
  id: number;
  name_ar: string;
  name_en: string;
  status: 'active' | 'inactive';
}
```

### `TransferPrefill`
```ts
interface TransferPrefill {
  client_id?: number;
  product_id?: number;
  qty?: number;
}
```

---

## 🔧 State & Data Flow

```
transfers/page.tsx
  │
  ├── transfers: Transfer[]          ← useState(MOCK_TRANSFERS)  — 8 items
  ├── clientFilter / productFilter   ← useState('')              — toolbar selects
  ├── page                           ← useState(1)               — resets on filter change
  ├── isLoading                      ← 650ms simulated delay
  ├── modalOpen                      ← boolean
  │
  ├── filtered = useMemo(...)        ← client_id + product_id match
  └── paginated = filtered.slice(…)  ← PAGE_SIZE = 10

TransfersTableCard (receives paginated slice)
  └── toolbar: client select + product select + export button
  └── CSS grid 6 columns: date | client | product | qty | notes | recorded_by
  └── mobile: stacked card (md:hidden / hidden md:grid)

TransferModal (opens on "+ New transfer")
  └── react-hook-form — 5 fields: clientId, productId, qty, date, notes
  └── Confirm button disabled in real-time: !clientId || !productId || !qty || qty≤0 || qtyExceeds
  └── onSave → prepends new Transfer to top of list + toast.success(…)
```

---

## 🧩 Component Reference

### `TransfersTableCard`

| Prop | Type | Purpose |
|------|------|---------|
| `transfers` | `Transfer[]` | Paginated slice to render |
| `filteredCount` | `number` | Total matching count (drives pagination) |
| `isLoading` | `boolean` | Shows 6 skeleton rows when true |
| `clientFilter` | `string` | Client ID string or `''` for all |
| `productFilter` | `string` | Product ID string or `''` for all |
| `clients` | `TransferClient[]` | All clients for toolbar dropdown |
| `products` | `TransferProduct[]` | All products for toolbar dropdown |
| `onAddTransfer` | `() => void` | Opens modal from empty state button |

**Grid columns**: `1.1fr 1.6fr 1.8fr 1fr 1.4fr 1.2fr`  
**Empty state icon**: `Truck` from lucide-react

---

### `TransferModal`

| Prop | Type | Purpose |
|------|------|---------|
| `open` | `boolean` | Controls visibility |
| `onClose` | `() => void` | Closes modal |
| `onSave` | `(t: Omit<Transfer, 'id'>) => void` | Called on valid submit |
| `prefill?` | `TransferPrefill` | Pre-selects client, product, qty |

**Modal width**: `sm:max-w-130` (520px)

**Form fields:**
1. **Client select** (required) — active clients only
2. **Product select** (required) — `is_active && available_qty > 0`; option text: `"Name — qty"`
3. **Qty + Date** (2-col grid)
   - Qty: type=number, hint below shows `"Available in warehouse: N"` when product selected
   - Date: type=date, defaults to today
4. **Availability banner** — shown when product selected + qty > 0
   - Green (`#DDEEE3`): qty ≤ available — "Available in warehouse: N units"
   - Red (`#F6DDDB`): qty > available — "Quantity exceeds available stock"
5. **Notes** — textarea, rows=2, optional

**Date helpers** (module-private):
- `formatDateEN("2026-06-14")` → `"14 Jun 2026"`
- `formatDateAR("2026-06-14")` → `"٢٠٢٦/٠٦/١٤"` (Eastern Arabic numerals)

---

## 📊 Mock Data

### `MOCK_TRANSFERS` — 8 Records

| ID | Date | Client | Product | Qty | Notes |
|----|------|--------|---------|-----|-------|
| 1 | 30 May 2026 | Al Nakheel Supermarket | UHT Milk 1L | 120 | Weekly order |
| 2 | 30 May 2026 | Al Waha Grocery | Mineral Water 500ml | 300 | — |
| 3 | 29 May 2026 | Al Baraka Restaurant | Canned Tuna | 60 | Urgent refill |
| 4 | 29 May 2026 | Al Safa Cafeteria | Orange Juice 1L | 48 | — |
| 5 | 28 May 2026 | Al Reef Grocery | Cheddar Cheese | 35 | New order |
| 6 | 27 May 2026 | Al Nakheel Supermarket | Paper Tissues | 90 | — |
| 7 | 26 May 2026 | Al Waha Grocery | Floor Cleaner | 24 | Cleaning |
| 8 | 26 May 2026 | Al Baraka Restaurant | Mineral Water 500ml | 240 | — |

### `MOCK_TRANSFER_PRODUCTS` — 12 Products

| ID | EN Name | Available Qty |
|----|---------|---------------|
| 1 | Mineral Water 500ml | 850 |
| 2 | Energy Drink | 340 |
| 3 | Hand Soap | 120 |
| 4 | UHT Milk 1L | 420 |
| 5 | Cheddar Cheese | 210 |
| 6 | Floor Cleaner | 160 |
| 7 | Potato Chips | 280 |
| 8 | Canned Tuna | 240 |
| 9 | Toast Bread | 180 |
| 10 | Orange Juice 1L | 310 |
| 11 | Cooking Oil | 520 |
| 12 | Paper Tissues | 440 |

---

## 🌐 i18n Keys

Both `src/i18n/en/transfers.json` and `src/i18n/ar/transfers.json` cover:

```
transfers.page.{title, count, newTransfer}
transfers.toolbar.{allClients, allProducts, export}
transfers.table.{date, client, product, qty, notes, recordedBy}
transfers.emptyState.{title, sub}
transfers.pagination.{showing}
transfers.modal.{title, clientLabel, clientPlaceholder, productLabel, productPlaceholder,
                 qtyLabel, qtyHint, dateLabel, notesLabel, availableBanner, exceedsBanner,
                 confirm, cancel, errClient, errProduct, errQtyRequired, errQtyPositive, errQtyExceeds}
transfers.toast.{success}
```

---

## 📱 Responsive Behaviour

| Breakpoint | Table header | Data rows | Modal |
|------------|-------------|-----------|-------|
| Mobile `<md` | Hidden | Stacked card (flex-col) | Slide up from bottom (rounded-t-2xl) |
| Tablet/Desktop `≥md` | CSS grid 6-col | CSS grid 6-col | Centred overlay (max-w-130) |
| Tablet toolbar | Wraps to two rows | — | Form 2-col → 1-col |

---

## 🔗 Integration Points

### Used from Dashboard / Shortages (future)
```tsx
// Prefill with client + product + suggested qty
<TransferModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  onSave={handleSave}
  prefill={{ client_id: 2, product_id: 4, qty: 120 }}
/>
```

The modal resets to prefill values every time `open` transitions from `false` → `true`.

---

## ⚠️ Known Gaps (pre-API integration)

| Gap | Impact | Fix When |
|-----|--------|----------|
| Mock data — transfers not persisted across page reload | Dev only | API integration |
| Product quantities not actually deducted on save | Dev only | API integration |
| `recorded_by` is hardcoded to "Salem Al Mansoori" | Dev only | Read from auth store |
| Notes stored as same string in both `_ar` and `_en` fields | Minor | Separate AR/EN note inputs |

---

## ✅ Acceptance Criteria

- [x] Page renders 8 mock transfers with correct 6-col grid
- [x] Client filter narrows the list by client_id; resets to page 1
- [x] Product filter narrows the list by product_id; resets to page 1
- [x] Skeleton shimmer shows for 650ms on load
- [x] Empty state (Truck icon) shown when no matching transfers
- [x] "+ New transfer" button opens TransferModal
- [x] Modal: active clients only in client dropdown
- [x] Modal: only `is_active && available_qty > 0` products shown
- [x] Modal: product option shows `"Name — availableQty"`
- [x] Modal: qty hint appears below qty field when product selected
- [x] Modal: green banner when qty ≤ available, red banner when qty > available
- [x] Modal: Confirm disabled until client + product + valid qty filled; also disabled when qty exceeds stock
- [x] On save: new transfer prepended to top of list
- [x] On save: success toast shown
- [x] On save: modal closes
- [x] `prefill` prop pre-selects client, product, qty (for Dashboard / Shortages use)
- [x] Mobile: stacked card layout below md breakpoint
- [x] All text switches AR ↔ EN on locale toggle
- [x] `npx tsc --noEmit` passes with zero errors

---

## 🔗 Related

- Clients feature: `src/features/clients/` — `ClientAvatar` component reused in table rows
- Products feature: `src/features/products/` — `ProductThumb` component reused in table rows
- Dashboard: will call `<TransferModal prefill={...} />` from the "New transfer" button and low-stock widget
- Shortages page: will call `<TransferModal prefill={...} />` from "Transfer stock" action
