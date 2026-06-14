# Project Updates & Changelog

All changes documented chronologically with details.

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
