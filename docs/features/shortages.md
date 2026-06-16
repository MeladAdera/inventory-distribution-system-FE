# Feature: Shortages Admin Page (FIGMA-006)

**Status**: ✅ API Integrated  
**Created Date**: 2026-06-14  
**Last Updated**: 2026-06-16  
**Assignee**: Melad Adera  
**Ticket**: FIGMA-006

---

## 📋 Overview

### Purpose
The Shortages admin page (`/shortages`) surfaces all shop inventory items whose current quantity has dropped below the defined minimum threshold. It gives the warehouse manager a count of out-of-stock vs low-stock situations and a one-click path to open `TransferModal` pre-filled with the shop, product, and suggested replenish quantity.

### Business Value
- Summary strip shows out-of-stock and low-stock counts at a glance
- Shop + status filter for focused triage
- Replenish button opens the shared `TransferModal` with prefill — destination shop auto-selected
- Bilingual (AR/EN) with full RTL/LTR support

---

## 🏗️ Architecture

### File Structure
```
src/features/shortages/
├── components/
│   └── ShortagesTableCard.tsx     # Table: toolbar + 7-col CSS grid + skeleton + mobile cards
├── hooks/
│   └── useShortages.ts            # Parallel fetch: low-stock inventory + shops
├── types/
│   └── shortages.types.ts         # Shortage, ShortageClient, ShortageStatus
└── index.ts                       # Barrel export (re-exports useShortages, types)

src/app/(dashboard)/shortages/page.tsx   # Page — summary strip, filter state, replenish flow
src/i18n/en/shortages.json               # English translations
src/i18n/ar/shortages.json               # Arabic translations
```

**Cross-feature dependency**: The page imports `TransferModal` and `useTransfers` from `src/features/transfers/` — shortages do not own a modal, they reuse the shared one.

---

## 🪝 `useShortages()`

Runs two parallel queries:
1. `GET /inventory?lowStock=true&limit=100` — all inventory items below threshold
2. `GET /shops?type=SHOP&limit=100` — all shops (to resolve `shop_id → shop_name`)

Then maps `InventoryItem → Shortage`:
```typescript
{
  id:             item.id,
  product_id:     item.product_id,
  product_name:   item.product_name,
  client_id:      item.shop_id,
  client_name_ar: shopMap.get(item.shop_id) ?? `Shop #${item.shop_id}`,
  client_name_en: shopMap.get(item.shop_id) ?? `Shop #${item.shop_id}`,
  remaining:      item.current_quantity,
  min:            item.low_stock_threshold,
  suggested:      Math.max(threshold - current, 1),
  status:         current === 0 ? 'out' : 'low',
}
```

Returns `{ shortages, clients, shops, isLoading, error }`.

### Why two separate fetches?
The inventory API only returns `shop_id`, not the shop name. A `shopId → shopName` map is built from the shops response and applied during mapping.

---

## 🧩 Replenish Flow

1. User clicks "Replenish" on a shortage row
2. Page calls `handleReplenish(shortage)` which sets:
   ```typescript
   transferPrefill = {
     productId: shortage.product_id,
     quantity:  shortage.suggested,
     shopId:    shortage.client_id,   // pre-selects destination shop
   }
   ```
3. `TransferModal` opens with all three fields pre-filled
4. On save: `createTransfer({ items, shopId })` → `POST /orders`
5. Success → toast + modal closes

---

## 🌐 i18n Keys

```
shortages.page.{title, subtitle}
shortages.summary.{outOfStock, lowStock}
shortages.toolbar.{searchPlaceholder, allClients, allStatuses, statuses.{low, out}}
shortages.table.{product, client, remaining, min, suggested, status, actions, replenish}
shortages.emptyState.{title, sub}
```

---

## ✅ Acceptance Criteria

- [x] Summary strip shows live out-of-stock and low-stock counts
- [x] Table shows real low-stock items from `GET /inventory?lowStock=true`
- [x] Shop names resolved from parallel `GET /shops` fetch
- [x] Shop filter and status filter work client-side
- [x] Replenish button opens TransferModal with product, quantity, and shop pre-filled
- [x] Transfer save calls real `POST /orders` API
- [x] Skeleton loading while data fetches
- [x] `npx tsc --noEmit` — zero errors

---

## 🔗 Related

- Transfers: [transfers.md](transfers.md)
- Dashboard low-stock widget: [dashboard.md](dashboard.md)
- Inventory API: `src/features/inventory/`
