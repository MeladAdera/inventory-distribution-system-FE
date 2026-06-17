# Client Inventory Page

**Status**: ✅ Complete (mock data)  
**Version**: 1.0.3  
**Ticket**: CLIENT-003  
**Route**: `/client/inventory`  
**File**: `src/features/client-dashboard/components/ClientInventoryPage.tsx`  
**Page**: `src/app/client/inventory/page.tsx`

---

## Overview

The client inventory page lets shop owners manage what's on their shelves. It uses a **two-level drill-down**:

1. **View A — Category grid**: shows all categories with variant count + total qty + "Edited" badge when pending changes exist
2. **View B — Product cards**: drill into a category to see individual products; use steppers to add qty from back-stock; filter by All / Low / Out

Changes are batched and confirmed via a save modal. The page never calls an API until the user confirms — all state is local until save.

---

## File Structure

```
src/features/client-dashboard/
├── components/
│   └── ClientInventoryPage.tsx    ← full page (all sub-components defined locally)
└── mock/
    └── clientInventory.ts         ← ClientInventoryItem, ClientCategory, CLIENT_INVENTORY,
                                      CATEGORIES, LOW_STOCK_ITEMS

src/app/client/inventory/
└── page.tsx                       ← thin wrapper: <ClientInventoryPage />
```

---

## State Model

```ts
const [inventory, setInventory]     // ClientInventoryItem[] — local working copy
const [changes, setChanges]         // Record<productId, deltaQty> — pending adds
const [selectedCat, setSelectedCat] // string | null — null = View A, catId = View B
const [query, setQuery]             // string — search text (View A: categories; View B: products)
const [filter, setFilter]           // 'all' | 'low' | 'out' — View B filter tabs
const [modalOpen, setModalOpen]     // boolean — save confirmation modal
```

---

## View A — Category Grid

Shown when `selectedCat === null`.

Each `CategoryCard` shows:
- Category icon (Lucide, 32px, amber-600)
- Category name (AR/EN)
- Variant count (products in this category)
- Total qty (sum of all qty in category)
- "Edited" badge (amber-100/700) when any change exists for this category's products

Clicking a card sets `selectedCat = category.id`.

---

## View B — Product Cards

Shown when `selectedCat !== null`.

**Header row**:
```
[← Back]  Category name  [Save Changes] (hidden sm:flex — desktop only)
```

**Filter tabs** (`All / Low / Out`):
- Ink-900 background + amber-500 text + bottom border on active tab

**Product card layout**:
```
[ProductThumb 40px] [Name]                    [InvStatusBadge]
                    [Qty: X  Min: Y]
                    [Stepper: − delta +]  ← visible when backStock > 0
                    [Order more →]        ← visible when backStock = 0
```

### `Stepper`

Controls the **delta** (qty to add from back-stock), not the absolute qty.

```ts
// value = changes[item.id] ?? 0  (delta, not current qty)
// min = 0   → minus disabled at 0
// max = item.backStock → plus disabled at max
```

### `InvStatusBadge` (local)

| Status | Style |
|---|---|
| HIGH_STOCK / enough | success-100 bg + success-700 text |
| LOW_STOCK | warning-100 bg + warning-700 text |
| OUT_OF_STOCK | danger-100 bg + danger-700 text |

---

## Save Flow

1. User adjusts steppers → `changes` accumulates `{ [productId]: delta }`
2. **Desktop**: "Save Changes" button in header → opens modal
3. **Mobile**: sticky bar above bottom nav (`fixed bottom-14 sm:hidden`) → opens modal
4. **Modal** (`SaveModal`) shows each changed item: `Name: qty → qty + delta`
5. User confirms → `handleSave()`:
   - Applies all deltas to `inventory` copy
   - Recalculates `status` via `calcStatus(newQty, item.min)`
   - Resets `changes` to `{}`
   - Calls `toast.success(t.client.inventory.toast.success)`

### `calcStatus` helper

```ts
function calcStatus(qty: number, min: number): StockStatus {
  if (qty === 0)      return StockStatus.OUT_OF_STOCK;
  if (qty < min)      return StockStatus.LOW_STOCK;
  return StockStatus.HIGH_STOCK;
}
```

---

## Mobile Sticky Save Bar

Positioned above the bottom nav to avoid overlap:

```tsx
<div className="sm:hidden fixed bottom-14 left-0 right-0 z-20 ...">
  <Button onClick={() => setModalOpen(true)}>
    {t.client.inventory.saveChanges} ({Object.keys(changes).length})
  </Button>
</div>
```

`bottom-14` = 56px = height of `ClientBottomNav` which is `h-14 fixed bottom-0`.

---

## Empty States

| Condition | Message |
|---|---|
| `inventory.length === 0` | `t.client.inventory.empty.noProducts` |
| Category has no products | `t.client.inventory.empty.noCatProducts` |

---

## Mock Data (`clientInventory.ts`)

### `CATEGORIES`

| id | nameEn | icon |
|---|---|---|
| `bev` | Beverages | CupSoda |
| `dry` | Dairy | Milk |
| `cln` | Cleaning | SprayCan |
| `can` | Canned | Soup |

### `CLIENT_INVENTORY` (8 products)

| id | nameEn | qty | min | backStock | status | categoryId |
|---|---|---|---|---|---|---|
| 1 | Mineral water 500ml | 84 | 40 | 200 | HIGH | bev |
| 2 | Energy drink | 6 | 20 | 0 | LOW | bev |
| 4 | Long-life milk 1L | 120 | 50 | 60 | HIGH | dry |
| 5 | Cheddar cheese 200g | 28 | 15 | 40 | HIGH | dry |
| 7 | Hand soap | 6 | 30 | 0 | LOW | cln |
| 8 | Canned tuna | 0 | 25 | 0 | OUT | can |
| 10 | Orange juice 1L | 44 | 24 | 30 | HIGH | bev |
| 12 | Paper tissues | 9 | 35 | 12 | LOW | cln |

---

## i18n Keys (`t.client.inventory`)

```json
{
  "title": "My Inventory",
  "subtitle": "...",
  "search": "Search category or product...",
  "saveChanges": "Save Changes",
  "edited": "Edited",
  "variants": "variants",
  "totalQty": "Total Qty",
  "availableProducts": "available products",
  "currentQty": "Current Qty",
  "updateQty": "Update Qty",
  "fromBackStock": "from back-stock",
  "noBackStock": "No back-stock available",
  "orderMore": "Order more",
  "statusEnough": "Enough",
  "statusLow": "Low Stock",
  "statusOut": "Out of Stock",
  "filters": { "all": "All", "low": "Low", "out": "Out" },
  "modal": {
    "title": "Confirm Inventory Update",
    "intro": "The following quantities will be updated:",
    "noChanges": "No changes made yet.",
    "confirm": "Confirm Save",
    "cancel": "Cancel"
  },
  "toast": { "success": "Inventory updated successfully" },
  "empty": {
    "noProducts": "No products assigned to your account yet.",
    "noCatProducts": "No products in this category."
  }
}
```

---

## API Integration (pending)

| Action | Endpoint |
|---|---|
| Load inventory | `GET /inventory?shopId=X` |
| Load categories | `GET /categories?shopId=X` |
| Save delta changes | `POST /inventory/stock-in` (one call per changed product) or bulk endpoint |

---

## Reused Components

| Component | Source |
|---|---|
| `ProductThumb` | `src/features/products/components/ProductThumb.tsx` |
| `StockStatus` enum | `src/features/products/types/products.types.ts` |
| `Modal` | `src/common/components/Modal.tsx` |
| `useToast` | `src/providers/ToastProvider.tsx` |
