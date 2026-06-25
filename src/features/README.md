# Features

Modular feature directories following a consistent structure.

## Directory Structure

Each feature follows this pattern:

```
features/feature-name/
├── api/              # API calls and data fetching
├── components/       # Feature-specific components
├── hooks/            # Custom hooks (useFeature, etc.)
├── types/            # TypeScript interfaces
├── validations/      # Zod validation schemas
└── README.md         # Feature documentation
```

## Features

- **auth** - Authentication, login, user session
- **admin/users** - User management (shop owners + employees); modals reused by client portal
- **admin/shops** - Shop management (admin portal)
- **settings** - Profile and shop settings; shared between admin and client portals
- **shop** - Client portal pages (dashboard, inventory, orders, employees, settings)
- **shared/inventory** - Inventory management
- **shared/orders** - Order management
- **shared/products** - Product management
- **shared/categories** - Category management

## Guidelines

1. Keep features independent and self-contained
2. Export public APIs via feature's `index.ts`
3. Use relative imports within feature
4. Use absolute imports (`@/`) for cross-feature imports
5. Each feature should have its own type definitions

## Example Import

```typescript
// From within feature
import { useInventory } from './hooks/useInventory';

// From other features
import { useInventory } from '@/features/inventory/hooks/useInventory';
```
