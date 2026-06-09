# Auth Feature

Authentication and user session management.

## Structure

```
auth/
├── api/
│   └── auth.api.ts      # API calls (login, logout, refresh)
├── hooks/
│   └── useAuth.ts       # useAuth hook
├── store/
│   └── authStore.ts     # Zustand auth state
├── types/
│   ├── auth.types.ts    # Auth interfaces
│   └── enums.ts         # User roles, statuses
├── utils/
│   └── token.utils.ts   # Token management
└── README.md
```

## Key Exports

### `useAuth()` Hook
```typescript
import { useAuth } from '@/features/auth/hooks/useAuth';

const { user, isAuthenticated, logout } = useAuth();
```

### `authApi` Functions
```typescript
import { authApi } from '@/features/auth/api/auth.api';

await authApi.login(email, password);
await authApi.logout();
```

### `tokenUtils` Helper
```typescript
import { tokenUtils } from '@/features/auth/utils/token.utils';

const token = tokenUtils.getAccessToken();
tokenUtils.clearTokens();
```

## User Roles

- `WAREHOUSE_ADMIN` - Full access
- `SHOP_OWNER` - Shop management
- `EMPLOYEE` - Limited access

## Session Management

1. **Login** - User credentials → tokens stored in localStorage
2. **Persist** - Zustand with localStorage middleware
3. **Refresh** - Auto-refresh on 401 via Axios interceptor
4. **Logout** - Clear tokens and redirect to login

## State Flow

```
Login Page
  ↓ (credentials)
authApi.login()
  ↓ (tokens + user)
useAuth().setAuth()
  ↓
Zustand Store (persisted)
  ↓
useAuth() hook available everywhere
```
