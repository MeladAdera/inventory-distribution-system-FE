# Feature Documentation: Change Password

**Status**: ✅ Complete
**Created Date**: 2026-07-12
**Last Updated**: 2026-07-12
**Assignee**: Melad Adera
**Backend**: `POST /auth/change-password` (branch `fix/orders-audit`)

---

## 📋 Overview

### Purpose
Lets any authenticated user change their own password from the Settings page. Previously only a warehouse admin could reset passwords (via user management), so a shop owner or employee had no self-service way to rotate their credentials.

### Business Value
Users can rotate a leaked or weak password themselves, without asking an admin. Combined with the backend's refresh-token revocation, changing the password also signs the account out of every other device — a simple "lost my phone" recovery path.

### Who Sees What

| Section | WAREHOUSE_ADMIN | SHOP_OWNER | EMPLOYEE |
|---------|:-:|:-:|:-:|
| Change Password card | ✅ | ✅ | ✅ |

The card lives on **both** settings pages — admin (`/settings`) and client portal (`/client/settings`) — since every role has an account and can change its own password.

---

## 🎯 Requirements

### Functional Requirements
- [x] Card with three fields: current password, new password, confirm new password
- [x] Show/hide toggle on every field (reuses the shared `PasswordInput` atom)
- [x] Client-side validation: all required, new password ≥ 6 chars, confirm must match
- [x] Wrong current password surfaces the backend's localized message (`CURRENT_PASSWORD_INCORRECT`)
- [x] On success: success toast + inline "signing you out" state, then automatic logout → `/login`
- [x] AR/EN i18n for all labels, hint, validation messages, and toast

### Non-Functional Requirements
- [x] No new UI primitive — reuses the existing `PasswordInput` (same eye toggle as the login screen)
- [x] Follows the settings feature's SoC: type → hook → card component
- [x] Handles the backend side effect (all refresh tokens revoked) so the user is never surprised by a forced logout later

---

## 🏗 Architecture

### File Structure

```
src/
├── features/auth/
│   ├── api/auth.api.ts                 # + changePassword()
│   └── types/auth.types.ts             # + ChangePasswordInput
│
├── features/settings/
│   ├── types/settings.types.ts         # + ChangePasswordFormValues
│   ├── hooks/useSettings.ts            # + useChangePassword()
│   └── components/
│       └── ChangePasswordCard.tsx      # the card (uses shared PasswordInput)
│
├── app/(admin)/settings/page.tsx       # renders <ChangePasswordCard />
├── app/client/settings/page.tsx        # renders <ChangePasswordCard />
│
└── i18n/{en,ar}/settings.json          # settings.security.*
```

### Component Hierarchy

```
SettingsPage / ClientSettingsPage
├── ProfileCard
├── ShopCard              (SHOP_OWNER only)
└── ChangePasswordCard    ← new
    ├── FieldRow ×3        (shared)
    │   └── PasswordInput  (common/components — eye toggle)
    └── submit + hint footer
```

### Data Flow

```
User fills current / new / confirm  →  submit
        ↓
react-hook-form validation (required, min 6, match)
        ↓
useChangePassword().changePassword({ currentPassword, newPassword })
        ↓
authApi.changePassword()  →  POST /auth/change-password  →  204 No Content
        ↓                                     (backend revokes ALL refresh tokens)
success toast + card shows "password changed" state
        ↓
setTimeout(1500ms) → useAuth().logout() → window.location = '/login'
```

---

## 🔌 API Integration

| Action | Endpoint | Hook |
|--------|----------|------|
| Change own password | `POST /auth/change-password` | `useChangePassword()` |

**Request body**

```json
{ "currentPassword": "…", "newPassword": "…" }
```

**Responses**

| Status | Meaning | FE handling |
|--------|---------|-------------|
| `204 No Content` | Password changed; all refresh tokens revoked | Toast + logout → `/login` |
| `401` `auth.CURRENT_PASSWORD_INCORRECT` | Current password wrong | `getErrorMessage(err)` → error toast (localized) |
| `400` | Validation (e.g. new password too short) | Error toast (localized message as-is) |

```typescript
// src/features/auth/api/auth.api.ts
changePassword: async (data: ChangePasswordInput): Promise<void> => {
  await apiClient.post('/auth/change-password', data);
},
```

---

## 🔁 The Re-Login Flow (important)

On success the backend **revokes every refresh token** for the user. The current access token keeps working until it expires (~15 min), but the next `/auth/refresh` would fail.

Rather than let the user carry on and hit a confusing forced logout 15 minutes later, the card takes the clean path:

1. Reset the form and switch the card to a "Password changed — signing you out" state.
2. Show a success toast.
3. After a short delay (`LOGOUT_DELAY_MS = 1500`), call `useAuth().logout()` — which POSTs `/auth/logout` (still valid via the live access token), clears the token cookies, and hard-redirects to `/login`.

A `hint` line under the submit button warns about this **before** submitting: _"Changing your password signs you out of all devices."_

---

## 🛡 Session Hardening (companion change)

The backend now treats a **re-used refresh token as theft** — resending an already-rotated token revokes all of the user's tokens and forces a re-login. To avoid tripping this by accident, the Axios interceptor (`src/common/api/client.ts`) was made **single-flight**: concurrent `401`s now await one shared `/auth/refresh` promise instead of each firing their own refresh with the same (soon-consumed) token. See [auth.md → Token Refresh](./auth.md) for the full write-up. This is what makes the post-change logout land cleanly instead of racing the revocation.

---

## 🌐 i18n Keys (`t.settings.security`)

```
settings.security.title / subtitle
settings.security.currentPassword / newPassword / confirmPassword
settings.security.submit / hint
settings.security.validation.currentRequired / newRequired / newMin / confirmRequired / mismatch
settings.security.done.title / subtitle
settings.security.toast.success
```

---

## 🔐 Security & Permissions

- Endpoint is self-service: it changes **only the caller's own** password (identity from the bearer token), so no role gate is needed — every authenticated user gets the card.
- Wrong current password is rejected server-side (`401`); the FE never compares passwords.
- Password fields default to masked; the show/hide toggle is opt-in per field and its button is `tabIndex={-1}` so it stays out of the tab order.
- New password minimum (6 chars) is enforced on both the client (RHF) and the server.

---

## 🎨 Design Decisions

- **Reused `PasswordInput`** instead of a bespoke toggle — same eye-toggle input already used on the login screen and user-creation modals, so behavior/styling stay consistent app-wide.
- **Always-open form** (no edit-toggle like Profile/Shop) — there's nothing to "view" for a password, so the card shows the form directly and swaps to a success state after submit.
- **Force re-login over silent expiry** — clearest UX given the token revocation; the alternative (let the access token die mid-session) reads as a random logout.

---

## 🚧 Known Limitations / Future Work

- No password-strength meter — only the 6-char minimum is enforced.
- No "log out other devices only" option — changing the password always ends the current session too (a backend constraint, not a UI choice).
- Forgot/reset-password (unauthenticated) flow is still out of scope; this covers the authenticated self-service change only.

---

## 🔄 Related Features

- **[Authentication](./auth.md)** — token lifecycle, the single-flight refresh interceptor, and `useAuth().logout()`
- **[Admin Settings](./admin/settings.md)** / **[Client Settings](./client/client-settings.md)** — host the card
- **API envelope contract** — success is `{ success, data, timestamp }`; errors carry a localized `message` surfaced via `getErrorMessage`
