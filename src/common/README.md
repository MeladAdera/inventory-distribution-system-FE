# Common

Shared utilities, types, and components used across the entire application.

## Directory Structure

```
common/
├── api/          # Axios client with interceptors
├── components/   # Reusable UI components (Button, etc.)
├── hooks/        # Shared custom hooks
├── layout/       # Layout components (Navbar, Sidebar)
├── types/        # Global type definitions
├── utils/        # Utility functions (cn, error handling)
├── constants/    # App-wide constants
└── README.md
```

## Subdirectories

### `/api`
- `client.ts` - Configured Axios instance
- Handles authentication, token refresh, error handling

### `/components`
- Reusable UI components
- Button, Dialog, Modal, etc.
- Should be framework-agnostic (pure Tailwind + React)

### `/hooks`
- Custom React hooks used across features
- Examples: usePermission, usePagination, useLocalStorage

### `/layout`
- Layout components: Navbar, Sidebar, DashboardLayout
- Page structure components

### `/types`
- Global TypeScript types
- API response types
- Shared interfaces

### `/utils`
- Helper functions: cn(), error parsing, formatting
- No business logic, pure utilities

### `/constants`
- App-wide constants (API endpoints, config, etc.)

## Usage

```typescript
// Import from common
import { Button } from '@/common/components';
import { apiClient } from '@/common/api';
import { cn } from '@/common/utils/cn';
```
