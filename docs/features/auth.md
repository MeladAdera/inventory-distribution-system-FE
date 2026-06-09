# Feature: Authentication

**Status**: ✅ Complete (Phase 1)
**Created**: 2026-06-09
**Last Updated**: 2026-06-09
**Tickets**: TICKET-009, TICKET-010, TICKET-011, TICKET-012

---

## Overview

The authentication feature handles user identity across the entire application. It covers the login flow, session persistence, token lifecycle, and logout. All other features depend on this working correctly — no protected route or authenticated API call is possible without it.

---

## Architecture

### File Structure

```
src/features/auth/
├── api/
│   └── auth.api.ts          # All auth HTTP calls
├── hooks/
│   ├── useAuth.ts           # Access auth state + logout
│   └── useLogin.ts          # Login form + submission logic
├── store/
│   └── authStore.ts         # Zustand global auth state
├── types/
│   ├── auth.types.ts        # All auth-related TypeScript types
│   └── enums.ts             # UserRole, OrderStatus, ProductSource
└── utils/
    └── token.utils.ts       # Direct localStorage token helpers

src/providers/
└── AuthProvider.tsx         # Session hydration on app mount

src/common/components/
├── FormField.tsx            # Label + input + inline error
├── LoadingSpinner.tsx       # Reusable SVG spinner
└── ErrorAlert.tsx           # Accessible error message box

src/app/(auth)/
└── login/
    └── page.tsx             # Login page
```

### Data Flow

```
User visits /login
      ↓
LoginPage (page.tsx)
      ↓
useLogin hook
  ├── react-hook-form + Zod  →  client-side validation
  └── authApi.login()        →  POST /auth/login
                                      ↓
                               NestJS backend
                                      ↓
                          { user, accessToken, refreshToken }
      ↓
setAuth()          →  Zustand store (isAuthenticated, user, tokens)
tokenUtils.setTokens()  →  localStorage['accessToken'], localStorage['refreshToken']
      ↓
router.replace('/dashboard')
```

### Session Hydration on Page Refresh

```
Page loads
      ↓
AuthProvider (mounted in providers/index.tsx)
      ↓
tokenUtils.getAccessToken()  →  reads localStorage['accessToken']
      ↓
authApi.getCurrentUser()     →  GET /auth/me
      ↓
    200 OK                   →  setAuth(user, accessToken, refreshToken)
    401 / error              →  clearAuth() + tokenUtils.clearTokens()
```

### Token Refresh (Axios Interceptor)

```
Any API call returns 401
      ↓
client.ts response interceptor
      ↓
reads localStorage['refreshToken']
      ↓
POST /auth/refresh
      ↓
  success  →  update localStorage tokens, retry original request
  failure  →  window.location.href = '/login'
```

### State Management

| Layer | What it stores | Key |
|---|---|---|
| Zustand (`auth-storage`) | `user`, `accessToken`, `refreshToken`, `isAuthenticated` | `localStorage['auth-storage']` |
| tokenUtils | `accessToken`, `refreshToken` (plain strings) | `localStorage['accessToken']`, `localStorage['refreshToken']` |

Both must be written together on login and cleared together on logout. The Axios interceptor reads only from the plain keys; Zustand is the source of truth for UI state.

---

## Types

```typescript
// src/features/auth/types/auth.types.ts

interface LoginCredentials {
  email: string;
  password: string;
}

interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

// All three response types wrap with the shared ApiResponse<T> contract
type LoginResponse       = ApiResponse<{ user: RequestUser; accessToken: string; refreshToken: string }>;
type RefreshTokenResponse = ApiResponse<{ accessToken: string; refreshToken: string }>;
type CurrentUserResponse  = ApiResponse<RequestUser>;

interface AuthState {
  user: RequestUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
```

---

## API Layer

```typescript
// src/features/auth/api/auth.api.ts

authApi.login(credentials: LoginCredentials)   → Promise<LoginResponse>
authApi.logout()                               → Promise<void>
authApi.refreshToken(refreshToken: string)     → Promise<RefreshTokenResponse>
authApi.getCurrentUser()                       → Promise<CurrentUserResponse>
```

---

## Hooks

### `useLogin`

Used exclusively by the login page. Encapsulates form state, validation, API call, error mapping and redirect.

```typescript
const { form, onSubmit, isLoading, serverError } = useLogin();

// form      → react-hook-form UseFormReturn (register, formState.errors)
// onSubmit  → wrapped handleSubmit, ready to pass to <form onSubmit>
// isLoading → true while POST /auth/login is in flight
// serverError → string | null, maps backend errors to user-friendly messages
```

**Error mapping:**

| Condition | Message shown |
|---|---|
| `error.response.status === 401` | "Invalid email or password" |
| `!error.response` (no network) | "Unable to connect to server. Please try again." |
| Any other error | "Something went wrong. Please try again." |

**Validation schema (Zod):**

| Field | Rules |
|---|---|
| `email` | Required, valid email format |
| `password` | Required, minimum 6 characters |

---

### `useAuth`

Used anywhere in the app that needs current user info or logout.

```typescript
const { user, isAuthenticated, logout } = useAuth();
```

**`logout()` flow:**
1. `POST /auth/logout` — invalidates session on backend
2. `clearAuth()` — resets Zustand state
3. `tokenUtils.clearTokens()` — removes `localStorage['accessToken']` and `['refreshToken']`
4. `window.location.href = '/login'` — hard redirect (clears all React state)

The backend call is wrapped in `try/finally` — local cleanup always runs even if the backend is unreachable.

---

## Shared Components

### `FormField`

```tsx
<FormField label="Email" error={errors.email?.message} required>
  <input {...register('email')} type="email" />
</FormField>
```

Renders: label → children (input slot) → error message (only when `error` is set).

### `LoadingSpinner`

```tsx
<LoadingSpinner size="sm" />  // sm | md | lg
```

SVG spinner, inherits text color, uses Tailwind `animate-spin`.

### `ErrorAlert`

```tsx
<ErrorAlert message="Invalid email or password" />
```

Red box with `role="alert"` for screen reader announcement.

---

## Login Page

**Route**: `/login` (inside `(auth)` route group)

**Layout**: `src/app/(auth)/layout.tsx` — centered card, `max-w-md`

**Already-authenticated redirect**: `useEffect` watches `isAuthenticated` from the Zustand store; if `true`, calls `router.replace('/dashboard')` immediately.

**UI elements:**
- Application title + subtitle
- `ErrorAlert` (server error, shown above fields)
- Email `FormField` with `<input type="email">`
- Password `FormField` with `<input type="password">`
- Submit button: disabled + spinner + "Signing in…" while loading

---

## Security Notes

- Tokens are stored in `localStorage` (not `httpOnly` cookies). This is acceptable for the current scope but makes the app vulnerable to XSS. A future hardening step would move to `httpOnly` cookies managed by the backend.
- The Axios interceptor uses a `_retry` flag to prevent infinite refresh loops on persistent 401s.
- The `AuthProvider` treats any error from `/auth/me` as an expired session and clears all local state, forcing a clean re-login.

---

## Known Issues

| Issue | Severity | Status |
|---|---|---|
| Zustand `auth-storage` not updated when interceptor refreshes tokens | Low | Open — only affects `useAuth().accessToken` mid-session; Axios always has the correct token |

---

## Related Features

- **Route Protection** (TICKET-013, upcoming) — depends on `isAuthenticated` from this feature
- **Role-Based Access** (TICKET-014, upcoming) — depends on `user.role` from this feature
- All other features — all authenticated API calls rely on the token written by `useLogin`

---

## Future Enhancements

- [ ] Move tokens to `httpOnly` cookies (XSS hardening)
- [ ] Sync Zustand tokens when interceptor refreshes mid-session
- [ ] Add token expiry pre-check before requests (avoid a round-trip 401)
- [ ] "Remember me" option
- [ ] Multi-tab session sync via `localStorage` event listener
