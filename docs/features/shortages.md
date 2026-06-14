# Feature: Shortages Admin Page (FIGMA-006)

**Status**: Mock Data — UI Complete  
**Created Date**: 2026-06-14  
**Last Updated**: 2026-06-14  
**Assignee**: Melad Adera  
**Ticket**: FIGMA-006

---

## 📋 Overview

### Purpose
The Shortages admin page (`/shortages`) surfaces all clients whose stock for a given product has dropped below the defined minimum level. It gives the warehouse manager an at-a-glance count of "out of stock" vs "low stock" situations and a one-click path to open `TransferModal` pre-filled with the client, product, and a suggested replenish quantity.

### Business Value
- Summary strip shows out-of-stock and low-stock counts at a glance
- Client + status filter for focused triage
- Replenish button opens the shared `TransferModal` with prefill — no re-entry required
- Bilingual (AR/EN) with full RTL/LTR support

---

## 🏗️ Architecture

### File Structure

```
src/features/shortages/
├── components/
│   └── ShortagesTableCard.tsx     # Table card: toolbar + 7-col CSS grid + skeleton + mobile cards
├── mock/
│   └── shortagesData.ts           # 5 MOCK_SHORTAGES + 6 MOCK_SHORTAGE_CLIENTS
├── types/
│   └── shortages.types.ts         # Shortage, ShortageClient, ShortageStatus
└── index.ts                       # Barrel export

src/app/(dashboard)/shortages/page.tsx   # Page — summary strip, filter state, replenish flow
src/i18n/en/shortages.json               # English translations
src/i18n/ar/shortages.json               # Arabic translations
```

**Cross-feature dependency**: The page imports `TransferModal` and `TransferPrefill` from `src/features/transfers/` — shortages do not own a modal, they reuse the shared one.

---

## 🧩 Type Reference

### `ShortageStatus`
```ts
type ShortageStatus = 'low' | 'out';
```

### `Shortage`
```ts
interface Shortage {
  id: number;
  client_id: number;
  client_name_ar: string;
  client_name_en: string;
  product_id: number;
  product_name_ar: string;
  product_name_en: string;
  remaining: number;       // Current client stock
  min_level: number;       // Threshold below which a shortage is raised
  status: ShortageStatus;  // 'out' = remaining 0; 'low' = remaining < min_level
  suggested: number;       // Recommended replenish quantity
}
```

### `ShortageClient`
```ts
interface ShortageClient {
  id: number;
  name_ar: string;
  name_en: string;
}
```

---

## 🔧 State & Data Flow

```
shortages/page.tsx
  │
  ├── shortages: Shortage[]    ← useState(MOCK_SHORTAGES)  — 5 items, read-only
  ├── clientFilter             ← useState('')               — toolbar client select
  ├── statusFilter             ← useState('')               — toolbar status select
  ├── isLoading                ← 650ms simulated delay
  ├── transferOpen / prefill   ← TransferModal state
  │
  ├── outCount = shortages.filter(s => s.status === 'out').length   ← summary strip
  ├── lowCount = shortages.filter(s => s.status === 'low').length   ← summary strip
  └── filtered = useMemo(...)  ← client_id + status match

ShortagesTableCard (receives filtered slice)
  └── toolbar: client select + status select + export button
  └── CSS grid 7 columns: client | product | remaining | minLevel | status | suggested | actions
  └── mobile: stacked card (md:hidden / hidden md:grid)
  └── empty state: PartyPopper icon (no shortages = good news)

TransferModal (opened by replenish button)
  └── prefill: { client_id, product_id, qty: shortage.suggested }
  └── onSave → toast.success + close (no list mutation — read-only in mock)
```

---

## 🧩 Component Reference

### `ShortagesTableCard`

| Prop | Type | Purpose |
|------|------|---------|
| `shortages` | `Shortage[]` | Already-filtered list to render |
| `isLoading` | `boolean` | Shows 5 skeleton rows when true |
| `clientFilter` | `string` | Controlled value for client select |
| `statusFilter` | `string` | Controlled value for status select (`''`, `'low'`, `'out'`) |
| `clients` | `ShortageClient[]` | All clients for toolbar dropdown |
| `onClientChange` | `(v: string) => void` | Filter callback |
| `onStatusChange` | `(v: string) => void` | Filter callback |
| `onReplenish` | `(s: Shortage) => void` | Opens TransferModal with prefill |

**Grid columns**: `1.6fr 1.8fr 1fr 1fr 1.1fr 1.1fr 130px`

**Cell details:**

| Column | Content | Style note |
|--------|---------|------------|
| Client | `ClientAvatar (28px)` + name | `font-medium`, truncated |
| Product | `ProductThumb (28px)` + name | `text-ink-700`, truncated |
| Remaining | Number | `font-mono font-semibold`; `text-danger-700` if out, `text-warning-700` if low |
| Min level | Number | `font-mono text-ink-500` |
| Status | `ShortageStatusBadge` | warning (low) / danger (out) pill |
| Suggested | `+N` | `font-mono font-medium text-ink-800` |
| Actions | Replenish button | Amber primary sm, `Truck` icon, right-aligned |

**`ShortageStatusBadge`** (module-private):
- `out` → `bg-danger-100 text-danger-700` dot + label
- `low` → `bg-warning-100 text-warning-700` dot + label

**Empty state**: `PartyPopper` icon — no button (shortages aren't manually created)

---

## 📊 Summary Strip

Two stat boxes rendered inline in the page (not a separate component):

| Box | Border color | Icon | Count source |
|-----|-------------|------|--------------|
| Out of stock | `#F6DDDB` | `XCircle` `text-danger-700` | `shortages.filter(s => s.status === 'out').length` |
| Low stock | `#FAEACB` | `AlertTriangle` `text-warning-700` | `shortages.filter(s => s.status === 'low').length` |

Count uses **`font-serif text-[22px] font-medium`** (IBM Plex Serif).

---

## 📊 Mock Data

### `MOCK_SHORTAGES` — 5 Records

| ID | Client | Product | Remaining | Min | Status | Suggested |
|----|--------|---------|-----------|-----|--------|-----------|
| 1 | Al Waha Grocery | Hand Soap | 6 | 30 | low | 50 |
| 2 | Al Nakheel Supermarket | Potato Chips | 0 | 25 | out | 80 |
| 3 | Al Safa Cafeteria | Energy Drink | 4 | 20 | low | 40 |
| 4 | Al Baraka Restaurant | Toast Bread | 0 | 15 | out | 30 |
| 5 | Al Reef Grocery | Paper Tissues | 9 | 35 | low | 60 |

**Summary strip values**: 2 out of stock, 3 low stock

---

## 🔗 Replenish Flow

```
User clicks "Replenish" on a shortage row
  ↓
handleReplenish(shortage) sets:
  transferPrefill = { client_id, product_id, qty: shortage.suggested }
  transferOpen = true
  ↓
TransferModal opens with prefill values pre-selected
  ↓
User confirms → handleTransferSave() called
  → toast.success("Stock transferred successfully")
  → modal closes
  (in real app: shortage row would be refreshed/removed)
```

---

## 🌐 i18n Keys

Both `src/i18n/en/shortages.json` and `src/i18n/ar/shortages.json` cover:

```
shortages.page.{title, subtitle}
shortages.summary.{outOfStock, lowStock}
shortages.toolbar.{allClients, allStatuses, statusLow, statusOut, export}
shortages.table.{client, product, remaining, minLevel, status, suggested, actions}
shortages.status.{low, out}
shortages.emptyState.{title, sub}
shortages.replenish
```

---

## 📱 Responsive Behaviour

| Breakpoint | Table header | Data rows | Summary strip |
|------------|-------------|-----------|---------------|
| Mobile `<md` | Hidden | Stacked card (flex-col) | Wraps (flex-wrap) |
| Tablet/Desktop `≥md` | CSS grid 7-col | CSS grid 7-col | Side-by-side |
| Mobile replenish | — | Full-width button | — |

---

## ⚠️ Known Gaps (pre-API integration)

| Gap | Impact | Fix When |
|-----|--------|----------|
| Mock data — shortages are read-only, list doesn't update after replenish | Dev only | API integration |
| Summary strip counts from full list, not filtered | Minor UX | Intentional — counts always reflect total |
| Product IDs in shortages mock differ from transfers mock for the same product names | Dev inconsistency | Unified product table from API |

---

## ✅ Acceptance Criteria

- [x] Page header: title + subtitle (no add button)
- [x] Summary strip: out-of-stock count (2) in danger-bordered box, low-stock count (3) in warning-bordered box
- [x] Counts use IBM Plex Serif `font-serif text-[22px]`
- [x] Table renders 5 mock shortages with 7-col grid
- [x] Client filter narrows list by client_id
- [x] Status filter narrows list by status
- [x] Remaining qty: `text-danger-700` when out, `text-warning-700` when low
- [x] Status badge: warning pill (low) / danger pill (out)
- [x] Suggested column shows `+N` format
- [x] Replenish button opens `TransferModal` prefilled with client, product, suggested qty
- [x] After save: toast shown, modal closes
- [x] Skeleton shows 5 rows for 650ms
- [x] Empty state: PartyPopper icon, no button
- [x] Mobile: stacked card, replenish button full-width
- [x] All text switches AR ↔ EN on locale toggle
- [x] `npx tsc --noEmit` passes with zero errors

---

## 🔗 Related

- Transfers feature: `src/features/transfers/` — `TransferModal` + `TransferPrefill` imported and reused
- Clients feature: `src/features/clients/` — `ClientAvatar` reused in table rows
- Products feature: `src/features/products/` — `ProductThumb` reused in table rows
- Dashboard: `src/features/dashboard/mock/dashboardData.ts` — `SHORTAGES` array is the dashboard widget data source (separate from this page's mock)
