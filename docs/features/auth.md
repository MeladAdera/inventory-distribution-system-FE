# Feature: Authentication

**Status**: ✅ Complete (Phase 1)
**Created**: 2026-06-09
**Last Updated**: 2026-06-09
**Tickets**: TICKET-009, TICKET-010, TICKET-011, TICKET-012 (Route Protection)

---

## Overview

The authentication feature handles user identity across the entire application. It covers the login flow, session persistence, token lifecycle, and logout. All other features depend on this working correctly — no protected route or authenticated API call is possible without it.

---

## Architecture

### File Structure

```
src/features/auth/
├── api/
│   └── auth.api.ts              # All auth HTTP calls
├── hooks/
│   ├── useAuth.ts               # Access auth state + logout
│   └── useLogin.ts              # Login form + submission logic
├── store/
│   └── authStore.ts             # Zustand global auth state
├── types/
│   ├── auth.types.ts            # All auth-related TypeScript types
│   └── enums.ts                 # UserRole, OrderStatus, ProductSource
└── utils/
    ├── token.utils.ts           # localStorage + cookie token helpers
    └── middleware.utils.ts      # Route lists + cookie reader for Edge middleware

src/middleware.ts                # Next.js Edge middleware — route protection

src/providers/
└── AuthProvider.tsx             # Session hydration on app mount

src/common/components/
├── FormField.tsx                # Label + input + inline error
├── LoadingSpinner.tsx           # Reusable SVG spinner
└── ErrorAlert.tsx               # Accessible error message box

src/app/(auth)/
└── login/
    └── page.tsx                 # Login page
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
setAuth()               →  Zustand store (isAuthenticated, user, tokens)
tokenUtils.setTokens()  →  localStorage['accessToken'], localStorage['refreshToken']
                           + cookie['auth_token'] (read by Edge middleware)
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

### Route Protection (Next.js Middleware)

```
Browser requests /dashboard (or any protected route)
      ↓
src/middleware.ts runs on the server edge — BEFORE the page loads
      ↓
reads cookie['auth_token']
      ↓
  token exists   →  NextResponse.next() — allow the request through
  no token       →  NextResponse.redirect('/login')

Browser requests /login while already authenticated
      ↓
src/middleware.ts
      ↓
  token exists   →  NextResponse.redirect('/dashboard')
  no token       →  NextResponse.next() — allow
```

**Protected routes**: `/dashboard`, `/inventory`, `/orders`, `/products`, `/shops`, `/users`, `/notifications`, `/audit-logs`

**Why cookies and not localStorage**: The middleware runs on the server edge — it has no access to the browser's localStorage. Cookies are sent with every HTTP request automatically, so the middleware can read them. `tokenUtils.setTokens()` writes the `auth_token` cookie at login; `tokenUtils.clearTokens()` expires it at logout.

---

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
  success  →  tokenUtils.setTokens()          — localStorage + cookie updated
             useAuthStore.getState().setTokens() — Zustand updated
             retry original request
      ↓
  failure  →  useAuthStore.getState().clearAuth() — Zustand cleared
             tokenUtils.clearTokens()           — localStorage + cookie cleared
             window.location.href = '/login'
```

The interceptor lives outside React so it uses `useAuthStore.getState()` (Zustand's static accessor) instead of the `useAuthStore()` hook. Both reach the same store — the static form just works without a React component context.

### State Management

| Layer | What it stores | Key | Read by |
|---|---|---|---|
| Zustand (`auth-storage`) | `user`, `accessToken`, `refreshToken`, `isAuthenticated` | `localStorage['auth-storage']` | React components |
| tokenUtils | `accessToken`, `refreshToken` (plain strings) | `localStorage['accessToken']`, `localStorage['refreshToken']` | Axios interceptor |
| Cookie | `accessToken` (copy) | `cookie['auth_token']` | Next.js Edge middleware |

All three must be written together on login and cleared together on logout. Zustand is the source of truth for UI state; the cookie is the source of truth for server-side route protection.

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
3. `tokenUtils.clearTokens()` — removes `localStorage['accessToken']`, `localStorage['refreshToken']`, and expires the `auth_token` cookie
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
- The `auth_token` cookie used by the middleware is **not** `httpOnly` (it is set by client-side JS). It provides routing protection, not cryptographic security — JWT validation remains the backend's responsibility.
- The Axios interceptor uses a `_retry` flag to prevent infinite refresh loops on persistent 401s.
- The `AuthProvider` treats any error from `/auth/me` as an expired session and clears all local state, forcing a clean re-login.
- The middleware uses a `matcher` that excludes `_next/static`, `_next/image`, `api`, and `favicon.ico` to avoid running on non-page requests.

---

## Known Issues

None.

---

## Related Features

- **Route Protection** (TICKET-012) ✅ — `src/middleware.ts` protects all dashboard routes using the `auth_token` cookie
- **Token Refresh Sync** (TICKET-013) ✅ — Axios interceptor now calls `useAuthStore.getState().setTokens()` and `tokenUtils.setTokens()` after a successful refresh; failure path clears all three stores before redirecting
- **Role-Based Access** (upcoming) — depends on `user.role` from this feature
- All other features — all authenticated API calls rely on the token written by `useLogin`

---

## Future Enhancements

- [ ] Move tokens to `httpOnly` cookies (XSS hardening)
- [ ] Sync Zustand tokens when interceptor refreshes mid-session
- [ ] Add token expiry pre-check before requests (avoid a round-trip 401)
- [ ] "Remember me" option
- [ ] Multi-tab session sync via `localStorage` event listener
