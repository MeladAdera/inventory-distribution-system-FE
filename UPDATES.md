# Project Updates & Changelog

All changes documented chronologically with details.

---

## [1.0.4] - 2026-06-17 - App Folder Structure Refactor

### Refactor — Flatten (client) route group

#### Changed
- **`app/(client)/client/*`** → **`app/client/*`** — removed redundant `(client)` route group wrapper; the group wrapped a single `/client/` URL prefix and added no multi-route layout benefit. All 5 files moved via `git mv` with zero import changes.

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [1.0.3] - 2026-06-17 - My Inventory Page

### Client Portal — My Inventory ✅

#### Added
- **`ClientInventoryPage.tsx`** — two-level drill-down inventory management. View A: category grid with variant count + total qty + "Edited" badge. View B: product cards with steppers (delta 0→backStock), filter tabs (All/Low/Out), search.
- **`SaveModal`** (inline) — shows `name: qty → qty + delta` per changed product; confirms batch save
- **Mobile sticky save bar** — `fixed bottom-14 sm:hidden` sits above bottom nav
- **`calcStatus(qty, min)`** helper — recalculates `StockStatus` after delta is applied
- **`inventory` namespace** — added to `en/client.json` + `ar/client.json`
- **`clientInventory.ts`** rewritten — added `categoryId` to `ClientInventoryItem`; added `CATEGORIES[]` with Lucide icons

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [1.0.2] - 2026-06-17 - Client Dashboard Page

### Client Portal — Dashboard ✅

#### Added
- **`ClientDashboardPage.tsx`** — KPI grid (3 cards: total products, to refill, last order); 2 quick action buttons; low-stock list with `ProductThumb`, `StockBadge`, "Order more"; all-good empty state
- **`clientInventory.ts`** — `ClientInventoryItem`, `ClientCategory`, `CLIENT_INVENTORY` (8), `CATEGORIES` (4), `LOW_STOCK_ITEMS` mock data
- **`dashboard` namespace** — added to `en/client.json` + `ar/client.json`
- **`src/app/client/dashboard/page.tsx`** — thin wrapper

#### Reuses
- `KpiCard`, `CardShell` from admin `features/dashboard/`
- `ProductThumb`, `StockStatus` from `features/products/`

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [1.0.1] - 2026-06-17 - Role-Based Portal Isolation

### Auth — SHOP_OWNER ↔ /client/*, Admin ↔ /dashboard ✅

#### Changed
- **`middleware.utils.ts`** — renamed `PROTECTED_ROUTES` → `ADMIN_ROUTES`; added `matchesRoute()`, `isAdminRoute()`, `isClientRoute()`, `getRoleFromToken()` (base64url JWT decode via `atob()` in Edge Runtime)
- **`middleware.ts`** — 3-step logic: (1) unauthenticated → /login; (2) authenticated + /login → role-aware portal redirect; (3) cross-portal block by role
- **`useLogin.ts`** — post-login redirect: `SHOP_OWNER → /client/dashboard`, others → `/dashboard`
- **`app.constants.ts`** — added `CLIENT_ROOT`, `CLIENT_DASHBOARD` to `ROUTES`

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [1.0.0] - 2026-06-17 - Client Portal Layout Shell

### Client Portal — Layout Shell ✅

#### Added
- **`src/common/layout/clientNavConfig.ts`** — `ClientNavItem` interface + `CLIENT_NAV_ITEMS` (4 nav entries)
- **`src/common/layout/ClientSidebar.tsx`** — dark ink-900 theme; amber active indicator (RTL-aware via `insetInlineStart`); `fluid` prop; portal switch link → `/dashboard`
- **`src/common/layout/ClientTopBar.tsx`** — page title from pathname; no search/bell; hamburger `hidden md:block lg:hidden`; language toggle + logout
- **`src/common/layout/ClientNavDrawer.tsx`** — tablet slide-in using `<ClientSidebar fluid />`
- **`src/common/layout/ClientBottomNav.tsx`** — `md:hidden fixed bottom-0 h-14`; 4 items; amber active state
- **`src/common/layout/ClientLayout.tsx`** — orchestrator with `drawerOpen` state
- **`src/app/client/layout.tsx`** — `'use client'` wrapper → `<ClientLayout>`
- **`src/i18n/en/client.json`** + **`src/i18n/ar/client.json`** — brand, nav, user, portalSwitch, topbar namespaces; wired into `src/i18n/index.ts`

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [0.9.8] - 2026-06-16 - Analytics Charts + RecentActivityFeed Locale Fix

### Analytics — Charts on real API ✅

#### Added
- **`src/features/analytics/types/analytics.types.ts`** — `TopProduct`, `TrendPeriod`, `TrendPoint` interfaces
- **`src/features/analytics/api/analytics.api.ts`** — `GET /analytics/top-products` + `GET /analytics/consumption-trend`
- **`src/features/analytics/hooks/useTopProducts.ts`** — 5-minute stale, returns `TopProduct[]`
- **`src/features/analytics/hooks/useConsumptionTrend.ts`** — 5-minute stale, `keepPreviousData` so chart dims instead of blanking on period switch
- **`docs/features/analytics.md`** — full analytics module documentation

#### Changed
- **`TopConsumedChart.tsx`** — removed mock `CHART_DATA`; calls `useTopProducts(5)` internally; 5-bar skeleton; empty state
- **`ConsumptionTrendChart.tsx`** — removed mock data; calls `useConsumptionTrend(mode)`; `opacity-50` while refetching; spinner on first load only

#### Fixed
- **`RecentActivityFeed.tsx`** — timestamps were always English regardless of locale. Private `formatAgo` removed; replaced with `formatRelativeTime(log.created_at, locale)` from `common/utils/string.utils`; `locale` pulled from `useI18n()`

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [0.9.7] - 2026-06-16 - Clients API Integration

### Clients Page — Real API Wired ✅

#### Added
- **`src/features/clients/hooks/useClients.ts`** — TanStack Query list + `createShopOwner` / `updateShop` / `toggleStatus` mutations; `Shop[]` mapped to `AdminClient[]`
- **`src/features/clients/components/AddShopOwnerModal.tsx`** — 5-field create modal using `addShopOwnerSchema`; calls `POST /users/shop-owners`
- **`src/features/clients/validations/clients.schema.ts`** — simplified `clientFormSchema` (edit-only: name, phone, address); new `addShopOwnerSchema` (shopName, shopAddress, ownerName, email, password)

#### Changed
- **`ClientFormModal.tsx`** — edit-only; removed `mode`/`onAdd` props; 3 fields (name, phone, address)
- **`clients/page.tsx`** — 300ms debounced search; server-side pagination; `handleAdd` → `createShopOwner`; `handleEdit` → `updateShop`; `handleToggleStatus` bidirectional (active→deactivate / inactive→activate)
- **`clients/index.ts`** — exports `AddShopOwnerModal`, `useClients`, `AddShopOwnerFormData`; removed `MOCK_CLIENTS`
- **`en/clients.json`** + **`ar/clients.json`** — added `add.*` section; `form.nameAr → form.name`; `delete.delete → "Deactivate"`; added `toast.{created, updated, deactivated, activated}`

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [0.9.6] - 2026-06-16 - Shortages & Dashboard API Integration

### Shortages Page — Real API Wired ✅

#### Added
- **`src/features/shortages/hooks/useShortages.ts`** — parallel fetch: `GET /inventory?lowStock=true` + `GET /shops?type=SHOP`; builds `shopId → shopName` map; returns `Shortage[]`

#### Changed
- **`shortages/page.tsx`** — live summary strip (out/low counts); table driven by `useShortages()`; replenish flow intact
- Removed `MOCK_SHORTAGES` and `MOCK_SHORTAGE_CLIENTS`

### Dashboard Page — Real API Wired ✅

#### Added
- **`src/features/dashboard/hooks/useDashboardStats.ts`** — 6 parallel TanStack Query calls (products total, shops total, pending orders, low-stock count, total orders, completed orders); 1-minute staleTime

#### Changed
- **`dashboard/page.tsx`** — all 6 KPI cards read from `useDashboardStats`; shows `—` while loading
- **`LowStockAlertsTable.tsx`** — self-contained; calls `useShortages()` internally
- **`RecentActivityFeed.tsx`** — self-contained; calls `useAuditLogs({ limit: 6 })` internally

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [0.9.5] - 2026-06-16 - Layout Real User Data + Sidebar Cleanup

### Layout — Real user data wired throughout ✅

#### Changed
- **`Sidebar.tsx`** — replaced hardcoded `t.sidebar.user.defaultName` with `user?.name` from `useAuth()`. Role label now uses `roles[user.role]` lookup instead of a static string. Extracted `NavSection` + `NavSectionProps` to `SidebarNavSection.tsx`.
- **`TopBar.tsx`** — same: `user?.name` and `roles[user.role]` from auth store. Avatar dropdown Profile item converted from `<button>` to `<Link href="/settings">` that also closes the dropdown. Removed client portal button and `ArrowLeftRight` import.
- **`DashboardLayout.tsx`** — same real user data pattern. Removed client portal button from mobile bottom sheet.
- **`dashboard/page.tsx`** — greeting now uses `{name}` placeholder replaced with `user.name.split(' ')[0]` (first name only).
- **`sidebar.json` (en + ar)** — removed `defaultName` and single `role` string; replaced with `roles` map keyed by `UserRole` enum (`WAREHOUSE_ADMIN`, `SHOP_OWNER`, `EMPLOYEE`).
- **`topbar.json` (en + ar)** — removed `defaultName` and `role`; removed `clientPortal` from avatar section.
- **`dashboard.json` (en + ar)** — greeting string changed to `"Good morning, {name}."` / `"صباح الخير، {name}."`.

#### Added
- **`src/common/utils/string.utils.ts`** — `getInitials(name)` extracted here as the single source of truth. All layout files and `profile.utils.ts` now import from this location. Removes four local duplicate implementations.
- **`src/common/layout/SidebarNavSection.tsx`** — `NavSection` component and `NavSectionProps` interface extracted from `Sidebar.tsx`. Sidebar now only contains the `Sidebar` component itself.

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [0.9.4] - 2026-06-16 - Settings Page

### Settings — Profile & Shop management ✅

#### Added
- **`src/app/(dashboard)/settings/page.tsx`** — Settings route. Shows `ProfileCard` for all roles; `ShopCard` visible to `SHOP_OWNER` only.
- **`src/features/settings/types/settings.types.ts`** — `ProfileCardProps`, `ProfileFormValues`, `ShopCardProps`, `ShopFormValues`.
- **`src/features/settings/utils/profile.utils.ts`** — `ROLE_BADGE_CLS` map; re-exports `getInitials` from `common/utils/string.utils`.
- **`src/features/settings/hooks/useSettings.ts`** — `useProfileSettings(userId)` wraps `PATCH /users/:id` + updates auth store on success. `useShopSettings(shopId)` wraps `GET /shops/:id` + `PATCH /shops/:id`.
- **`src/features/settings/components/shared.tsx`** — `CardHeader`, `CardFooter`, `InfoRow`, `FieldRow`, `inputCls`, `SkeletonRow`, `SkeletonBanner` shared across both cards.
- **`src/features/settings/components/ProfileCard.tsx`** — Avatar banner (ink-900 circle, amber initials), inline edit for name/email, role badge (read-only). On save, auth store is updated immediately.
- **`src/features/settings/components/ShopCard.tsx`** — Store icon banner, inline edit for name/address/phone, skeleton loading state.
- **`src/i18n/en/settings.json`** + **`src/i18n/ar/settings.json`** — all settings strings (profile, shop, roles, toasts).
- **`src/i18n/index.ts`** — wired `settingsEn` / `settingsAr` into both locales.

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [0.9.3] - 2026-06-15 - Multi-product Transfer Modal

### Transfers — Multi-product selection ✅

#### Changed
- **`transfers.types.ts`** — `CreateTransferInput` updated from `{ productId, quantity, shopId? }` to `{ items: TransferOrderItem[], shopId? }`. New `TransferOrderItem` interface: `{ productId: number; quantity: number }`.
- **`transfers.api.ts`** — `create()` now passes `data` directly to `POST /orders` (no more manual single-item wrapping). The backend already accepted `items[]`; the API layer now exposes that properly.
- **`TransferModal.tsx`** — full rewrite using `useFieldArray`:
  - Dynamic list of product rows; "+ Add product" button appends new empty rows
  - Each row is a separate `ProductRow` component that independently calls `useProduct(productId)` so the availability hint and green/red banner update per product
  - Remove button (`Trash2`) visible on rows beyond the first; spacer `div` keeps grid alignment when hidden
  - Confirm button only checks admin-requires-shop and `isSaving`; per-row validation (required, qty > 0, qty ≤ stock) runs on submit
  - `onSave` signature changed: `(productId, quantity, shopId?) → (items[], shopId?)`
- **`transfers/page.tsx`** — `handleSave` updated to match new signature; passes `{ items, shopId }` to `createTransfer`
- **`shortages/page.tsx`** — `handleTransferSave` signature updated to `(_items, _shopId?)` (still mock data; signature synced to compile)
- **`i18n/en/transfers.json`** + **`i18n/ar/transfers.json`** — added `modal.productsLabel` ("Products" / "المنتجات") and `modal.addProduct` ("+ Add product" / "+ إضافة منتج")

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [0.8.1] - 2026-06-14 - Category Dropdown & Product Create Bugfixes

### Bug Fixes

#### Bug 1 — `GET /categories` returned 400 (wrong query params)
- **`categories.api.ts`** — removed hardcoded `page: 1, limit: 100` defaults from `list()`. The backend `/categories` endpoint is non-paginated and rejected those params with "Validation failed (numeric string is expected)". Now passes only `params` as-is.

#### Bug 2 — Category dropdown always empty (wrong response type + accessor)
- **`useCategories.ts`** — corrected query type from `ApiResponse<PaginatedResponse<Category>>` to `ApiResponse<Category[]>` (backend returns a flat array, not a paginated wrapper). Fixed unwrap accessor from `.data?.data?.data` (one level too deep) to `.data?.data`. Removed unused `PaginatedResponse` import.

#### Bug 3 — `shopId` missing from auth store
- **`auth/types/auth.types.ts`** — added `shopId?: number` to `RequestUser`. The JWT payload includes `shopId` but the TypeScript interface didn't declare it, so it was silently dropped when the user was stored on login.

#### Bug 4 — `POST /products` returned 400 for WAREHOUSE_ADMIN (missing `shop_id`)
- **`auth/utils/token.utils.ts`** — added `getShopId()` utility that decodes `shopId` directly from the JWT cookie, providing a reliable fallback even if the login response body doesn't include it.
- **`products/page.tsx`** — `handleAdd` now passes `shop_id: user?.shopId ?? tokenUtils.getShopId()` to `createProduct`. WAREHOUSE_ADMIN requires `?shop_id=X` on the create endpoint; without it the backend had no shop context and returned 400.

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [0.8.0] - 2026-06-14 - Products API Integration + Categories Fix

### Products Page — Real API Wired ✅

#### Added
- **`useProduct(id)`** hook in `useProducts.ts` — calls `GET /products/:id`, enabled only when `id !== null`; used by `ProductDetailModal` to fetch `current_quantity`
- **`ProductDetail`** type in `products.types.ts` — extends `Product` with `current_quantity: number`
- **`StockStatus`** enum — `OUT_OF_STOCK | LOW_STOCK | HIGH_STOCK`
- **`productsApi.getById`** now explicitly typed as `Promise<ApiResponse<ProductDetail>>`
- **`totalPages`** added to `PaginatedResponse<T>` in `api.types.ts`

#### Updated
- **`products.types.ts`**
  - `price` type changed `number → string` (backend returns `"1200.00"` as string; code uses `Number(price)` for display)
  - `ProductListParams` expanded: added `category_name`, `is_active`, `stock_status`
  - `UpdateProductInput` expanded: added `barcode`, `category_id`
- **`ProductDetailModal`** — now fires `useProduct(id)` when it opens; shows `current_quantity` row with shimmer skeleton while loading
- **`ProductFormModal`** — edit mode `reset` converts `Number(product.price)` since `price` is now `string`
- **`products/index.ts`** — exports `useProduct`, `ProductDetail`, `StockStatus`
- **`i18n/en/products.json`** + **`i18n/ar/products.json`** — added `detail.currentQty` ("Current stock" / "المخزون الحالي")

#### Categories Fix
- **`categories.api.ts`** — `list()` now always sends `{ page: 1, limit: 100, ...params }` — fixes 400 Bad Request ("Validation failed: numeric string is expected") caused by NestJS `ParseIntPipe` requiring explicit numeric pagination params
- **`useCategories.ts`** — query type corrected from `ApiResponse<Category[]>` to `ApiResponse<PaginatedResponse<Category>>`; unwrap updated from `.data?.data` to `.data?.data?.data` to reach the actual `Category[]`

#### Known Gaps (open)
- Search field in toolbar sends `search` param that the backend ignores for products
- Edit form only sends `{name, description, price}` — barcode and category_id changes on edit are not saved
- No error toast / feedback when API mutations fail

#### Build
```
✅ npx tsc --noEmit — 0 errors
```

---

## [0.7.0] - 2026-06-11 - FIGMA-004: Clients Admin Page

### Clients Page ✅

#### Added
- **`src/app/(dashboard)/clients/page.tsx`** — page with full CRUD state (add/edit/delete), search + status filter, pagination, discriminated-union modal routing
- **`src/features/clients/components/ClientsTableCard.tsx`** — toolbar (name/phone search + status select + export), 8-column CSS grid table, skeleton shimmer, empty state, pagination; phone cell forced `ltr`
- **`src/features/clients/components/ClientAvatar.tsx`** — 34px initials circle (`bg-ink-900`, `text-amber-500`); initials = first letter per word, max 2; font-size = 40% of size prop
- **`src/features/clients/components/ClientStatusBadge.tsx`** — dot + label pill for active / inactive
- **`src/features/clients/components/ClientFormModal.tsx`** — add/edit modal with React Hook Form + Zod; amber credentials info banner (`key-round` icon); fields: nameAr (required), nameEn, phone (required), address, notes
- **`src/features/clients/components/ClientDeleteConfirmModal.tsx`** — danger confirm, intentionally no backdrop close
- **`src/features/clients/mock/clientsData.ts`** — 6 `MOCK_CLIENTS` (5 active, 1 inactive) across 5 UAE cities

#### Updated
- **`src/features/clients/types/clients.types.ts`** — new file: `AdminClient`, `ClientStatus`
- **`src/features/clients/validations/clients.schema.ts`** — new file: `clientFormSchema`, `ClientFormData`
- **`src/features/clients/index.ts`** — barrel export
- **`src/i18n/en/clients.json`** + **`src/i18n/ar/clients.json`** — full AR/EN translations for page, toolbar, table, form, delete modal
- **`src/i18n/index.ts`** — wired `clients` translations into the typed i18n object

#### Build
```
✅ npx tsc --noEmit — 0 errors
✅ All Tailwind classes canonical
```

---

## [0.6.0] - 2026-06-11 - FIGMA-003: Products Admin Page

### Products Page ✅

#### Added
- **`src/app/(dashboard)/products/page.tsx`** — page with full CRUD state, filtering, pagination, modal routing
- **`src/features/products/components/ProductsTableCard.tsx`** — toolbar (search + 2 selects + export), 8-column CSS grid table, skeleton shimmer, empty state, pagination
- **`src/features/products/components/ProductThumb.tsx`** — coloured square + Package icon, size prop
- **`src/features/products/components/StatusBadge.tsx`** — dot + label pill for in_stock / low / out / inactive
- **`src/features/products/components/ProductFormModal.tsx`** — add/edit modal with React Hook Form + Zod; `z.number()` + `valueAsNumber: true` pattern
- **`src/features/products/components/ProductDetailModal.tsx`** — view-only detail (6 rows: WH qty, min stock, cost/sell price, total value, category)
- **`src/features/products/components/RestockModal.tsx`** — stepper + before/after summary boxes
- **`src/features/products/components/DeleteConfirmModal.tsx`** — danger confirm, intentionally no backdrop close
- **`src/features/products/mock/productsData.ts`** — 12 `MOCK_PRODUCTS` with correct SKUs, prices, colours, categories

#### Updated
- **`src/features/products/types/products.types.ts`** — added `AdminProduct`, `ProductCategory`, `ProductStatus`, `getProductStatus()`, `CATEGORY_COLORS`
- **`src/features/products/validations/products.schema.ts`** — added `adminProductFormSchema` using `z.number()` (not coerce) + `AdminProductFormData` type
- **`src/features/products/index.ts`** — full barrel export of all new types, functions, components, schema, mock
- **`src/i18n/en/products.json`** + **`src/i18n/ar/products.json`** — full AR/EN translations for page, toolbar, table, modals, pagination
- **`src/i18n/index.ts`** — wired `products` translations into the typed i18n object
- **`src/app/globals.css`** — added `@keyframes shimmer` + `.skeleton-shimmer` utility class

#### Bugs fixed during audit
- `RestockModal`: hardcoded `product.name_ar` → `locale === 'ar' ? product.name_ar : product.name_en`
- `ProductsTableCard`: table header keys were translated strings used as React `key` → replaced with stable `HEADER_KEYS` constant
- `ProductsTableCard`: verbose `ReturnType<typeof useI18n>['t']['products']` inline type → extracted as `ProductsT` module alias

#### Build
```
✅ npx tsc --noEmit — 0 errors
✅ All Tailwind classes canonical (linter clean)
```

---

## [0.5.0] - 2026-06-11 - FIGMA-002: Dashboard Page

*(previously recorded as in-progress — marked complete)*

---

## [0.1.0] - 2026-06-09 - PHASE 0 Complete

### Infrastructure Setup ✅

#### Added
- Next.js 16.2.7 with TypeScript strict mode
- Tailwind CSS 4.3.0 with custom CSS variables
- Axios HTTP client with request/response interceptors
- Token refresh logic with 401 error handling
- Automatic retry with exponential backoff

#### Configured
- ESLint with TypeScript support
- Prettier with project standards
- Husky pre-commit hooks
- lint-staged for staged file linting
- Path aliases for cleaner imports
- Environment variable validation with Zod

#### State Management & Data
- Zustand auth store with localStorage persistence
- TanStack Query (React Query) provider
- Custom hooks: useAuth, usePermission, usePagination
- API types with TypeScript interfaces

#### Project Structure
- Modular feature architecture
- Common utilities directory
- Config and provider separation
- App router with route groups
- Comprehensive README files

### Folder Structure ✅

#### Created 14 Directories
1. `src/app/` - Next.js app router
2. `src/features/auth/` - Authentication feature
3. `src/features/inventory/` - Inventory management
4. `src/features/orders/` - Order management
5. `src/features/products/` - Product catalog
6. `src/common/api/` - Axios client
7. `src/common/components/` - UI components
8. `src/common/hooks/` - Custom hooks
9. `src/common/layout/` - Layout components
10. `src/common/types/` - TypeScript definitions
11. `src/common/utils/` - Utility functions
12. `src/common/constants/` - App constants
13. `src/config/` - Configuration files
14. `src/providers/` - Context providers

#### Features Implemented
- Auth API (login, logout, refresh, getCurrentUser)
- Inventory CRUD operations
- Orders CRUD operations
- Products CRUD operations
- Token utilities (get, set, clear, validate expiry)
- Permission checking hook
- Pagination hook

### Documentation ✅

- README.md for each major directory
- PROJECT_STATUS.md for overview
- UPDATES.md for change tracking
- docs/ folder structure for detailed docs

### Build Status ✅

```
✅ Compiles without errors
✅ TypeScript strict mode passing
✅ ESLint passing (0 errors)
✅ No unused variables
✅ All routes working
```

### Commits

1. **feat: Complete Phase 0 infrastructure setup**
   - Axios client with interceptors
   - TanStack Query provider
   - Zustand auth store
   - API types and error handlers
   - Environment validation
   - Folder structures
   
2. **feat: Configure ESLint, Prettier, Husky, Tailwind CSS and shadcn components**
   - Code quality tools
   - Tailwind CSS setup
   - Custom Button component
   
3. **test: Initial setup**
   - Project initialization

---

## Version History

| Version | Date | Status | Highlights |
|---------|------|--------|-----------|
| 1.0.4 | 2026-06-17 | ✅ Release | App folder refactor — flatten (client) route group |
| 1.0.3 | 2026-06-17 | ✅ Release | Client My Inventory page — two-level drill-down + stepper |
| 1.0.2 | 2026-06-17 | ✅ Release | Client Dashboard page — KPI cards + low-stock list |
| 1.0.1 | 2026-06-17 | ✅ Release | Role-based portal isolation — middleware JWT decode |
| 1.0.0 | 2026-06-17 | ✅ Release | Client Portal layout shell — sidebar, topbar, nav, bottom nav |
| 0.9.8 | 2026-06-16 | ✅ Release | Analytics charts + RecentActivityFeed locale fix |
| 0.9.7 | 2026-06-16 | ✅ Release | Clients API integration — create/edit/deactivate |
| 0.9.6 | 2026-06-16 | ✅ Release | Shortages + Dashboard API integration |
| 0.9.5 | 2026-06-16 | ✅ Release | Real user data in layout, sidebar cleanup |
| 0.9.4 | 2026-06-16 | ✅ Release | FIGMA-007 Settings page (Profile + Shop) |
| 0.9.3 | 2026-06-15 | ✅ Release | Multi-product transfer modal |
| 0.9.2 | 2026-06-15 | ✅ Release | Transfers API integration |
| 0.8.1 | 2026-06-14 | ✅ Release | Category dropdown + product create bugfixes |
| 0.8.0 | 2026-06-14 | ✅ Release | Products API integration |
| 0.7.0 | 2026-06-11 | ✅ Release | FIGMA-004 Clients admin page |
| 0.6.0 | 2026-06-11 | ✅ Release | FIGMA-003 Products admin page |
| 0.5.0 | 2026-06-11 | ✅ Release | FIGMA-002 Dashboard page |
| 0.4.0 | 2026-06-10 | ✅ Release | FIGMA-001 Admin layout shell |
| 0.1.0 | 2026-06-09 | ✅ Release | PHASE 0 Complete |
| 0.0.1 | 2026-06-08 | ✅ Initial | Project setup |

---

## Next Phase Tasks (PHASE 1)

### Login Page Implementation
- [ ] Create login form component
- [ ] Validate email and password inputs
- [ ] Integrate with auth API
- [ ] Handle login errors
- [ ] Redirect on successful login
- [ ] Test login flow

### Auth Middleware
- [ ] Create middleware.ts
- [ ] Implement route protection
- [ ] Redirect unauthenticated users
- [ ] Role-based routing

### Auth Guards
- [ ] Create ProtectedRoute component
- [ ] Create RoleGuard component
- [ ] Create Unauthorized page
- [ ] Test access control

### Session Management
- [ ] Implement logout flow
- [ ] Handle token expiry
- [ ] Auto-refresh tokens
- [ ] Clear auth on logout

---

## Known Issues

None at this time. All systems operational.

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Build Time | < 10s | ~5s ✅ |
| Page Load | < 3s | N/A (dev) |
| Bundle Size | < 500KB | TBD |
| TypeScript Check | 0 errors | 0 ✅ |
| ESLint Check | 0 errors | 0 ✅ |

---

## Security Checklist

- [x] Environment variables validation
- [x] CORS-ready API client
- [x] Token refresh mechanism
- [x] Secure localStorage usage
- [x] Type-safe API calls
- [ ] Rate limiting (Phase 1)
- [ ] CSRF protection (Phase 1)
- [ ] Input sanitization (Phase 1)

---

## Testing Status

- [ ] Unit tests (Phase 2)
- [ ] Integration tests (Phase 2)
- [ ] E2E tests (Phase 2)
- [ ] Manual testing (In progress)

---

## Documentation Status

- [x] Project README
- [x] Folder READMEs
- [x] Project Status
- [x] Updates/Changelog
- [ ] API documentation
- [ ] Feature guides
- [ ] Deployment guide
- [ ] Architecture decisions

---

**Last Updated**: June 9, 2026  
**Next Update**: June 10, 2026 (PHASE 1 start)
