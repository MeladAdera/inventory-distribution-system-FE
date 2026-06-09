# API: Authentication

**Last Updated**: 2026-06-09
**Backend**: NestJS on `http://localhost:3001`
**Prefix**: `/auth`

---

## Overview

All authentication endpoints are unauthenticated except `GET /auth/me` and `POST /auth/logout`, which require a valid `Bearer` token. The Axios client in `src/common/api/client.ts` automatically attaches the token from `localStorage['accessToken']` to every request.

---

## Endpoints

### POST `/auth/login`

Authenticate a user and receive tokens.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Success response — 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "WAREHOUSE_ADMIN",
      "createdAt": "2026-06-09T10:00:00.000Z"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "timestamp": "2026-06-09T10:00:00.000Z"
}
```

**Error responses:**
| Status | `message` | Meaning |
|---|---|---|
| 401 | `"Invalid credentials"` | Wrong email or password |
| 400 | validation errors | Missing or malformed fields |

---

### POST `/auth/refresh`

Exchange a valid refresh token for a new token pair.

**Request body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Success response — 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "timestamp": "2026-06-09T10:05:00.000Z"
}
```

**Error responses:**
| Status | Meaning |
|---|---|
| 401 | Refresh token expired or invalid — user must log in again |

> This endpoint is called automatically by the Axios response interceptor in `src/common/api/client.ts` when any request returns 401. You should never need to call it directly.

---

### POST `/auth/logout`

Invalidate the current session on the backend.

**Headers required:** `Authorization: Bearer <accessToken>`

**Request body:** none

**Success response — 200 / 204:** empty

> Called by `useAuth().logout()`. Even if this fails (network error, already expired token), the frontend clears local state in the `finally` block.

---

### GET `/auth/me`

Return the currently authenticated user's profile.

**Headers required:** `Authorization: Bearer <accessToken>`

**Success response — 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "WAREHOUSE_ADMIN",
    "createdAt": "2026-06-09T10:00:00.000Z"
  },
  "timestamp": "2026-06-09T10:00:00.000Z"
}
```

**Error responses:**
| Status | Meaning |
|---|---|
| 401 | Token expired or missing — interceptor will attempt refresh |

> Called automatically by `AuthProvider` on every app mount (page load / refresh) to sync the Zustand store with fresh user data from the backend.

---

## Token Lifecycle

```
Login
  └─► accessToken (short-lived) + refreshToken (long-lived)
           │
           │  stored in localStorage['accessToken'] and ['refreshToken']
           │
  Any request ─► Axios interceptor reads localStorage['accessToken']
                        │
                     200 ─► proceed
                     401 ─► interceptor calls POST /auth/refresh
                                   │
                                200 ─► update localStorage tokens, retry request
                                401 ─► window.location.href = '/login'

Logout
  └─► POST /auth/logout (backend invalidates refresh token)
  └─► clearAuth() (Zustand reset)
  └─► tokenUtils.clearTokens() (localStorage cleared)
  └─► redirect to /login
```

---

## Frontend API Usage

```typescript
import { authApi } from '@/features/auth/api/auth.api';

// Login
const response = await authApi.login({ email, password });
const { user, accessToken, refreshToken } = response.data;

// Logout
await authApi.logout();

// Refresh (called internally by interceptor — not used directly)
const response = await authApi.refreshToken(refreshToken);

// Get current user
const response = await authApi.getCurrentUser();
const user = response.data;
```

---

## Error Handling

The frontend maps HTTP errors to user-facing messages in `useLogin.ts`:

| HTTP Status | User sees |
|---|---|
| 401 | "Invalid email or password" |
| No response (network down) | "Unable to connect to server. Please try again." |
| Any other error | "Something went wrong. Please try again." |

General API errors across the app are parsed by `src/common/utils/error.utils.ts`:

```typescript
import { parseApiError } from '@/common/utils/error.utils';

catch (error) {
  const message = parseApiError(error); // extracts message from AxiosError or generic Error
}
```

---

## User Roles

The `role` field on the user object controls access to features and routes.

| Role | Value | Description |
|---|---|---|
| Warehouse Admin | `WAREHOUSE_ADMIN` | Full access |
| Shop Owner | `SHOP_OWNER` | Access to own shop and orders |
| Employee | `EMPLOYEE` | Limited operational access |

Role checking is handled by the `usePermission` hook in `src/common/hooks/usePermission.ts`.

---

## Environment

The base URL for all requests is set in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

The Axios client throws a hard error at startup if this variable is missing — there is no fallback. See `src/common/api/client.ts`.

---

## Related Docs

- [Authentication Feature](../features/auth.md) — implementation details, hooks, components
- [Error Handling](error-handling.md) — general API error patterns
