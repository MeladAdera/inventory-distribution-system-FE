# Forgot / Reset Password

**Status**: ✅ Complete (real API integrated)
**Type**: Shared — public auth flow (any role)
**Created**: 2026-07-25
**Route**: `/forgot-password`
**Page**: `src/app/(auth)/forgot-password/page.tsx`
**Assignee**: Melad Adera

---

## Overview

Self-service password recovery for users who **cannot** sign in. A signed-in user changes their
password from settings instead ([change-password.md](change-password.md)) — this flow exists only
for the locked-out case.

One route, three steps, no navigation between pages:

```
step 'request'  →  enter email            →  POST /auth/forgot-password  (emails a 6-digit code)
step 'reset'    →  enter code + new pw    →  POST /auth/reset-password
step 'done'     →  success card           →  link to /login  (all sessions were revoked)
```

Entry point: **"Forgot password?"** link under the password field on the login page.

### Privacy-preserving by design

`POST /auth/forgot-password` always answers `200` with the same generic message — registered,
unregistered and deactivated emails are indistinguishable. The FE **never branches on account
existence**: it always advances to step two, and step two shows the deliberately vague notice
*"If that email exists, a reset code has been sent."* This is why there is no "no account found"
error state anywhere in the flow.

---

## File Structure

```
src/features/auth/
├── api/
│   └── auth.api.ts                  ← + forgotPassword(), resetPassword()
├── hooks/
│   └── useForgotPassword.ts         ← new — step machine + both RHF forms + error mapping
├── components/
│   ├── RequestCodeForm.tsx          ← new — step 1: email field
│   ├── ResetPasswordForm.tsx        ← new — step 2: code + new password + confirm
│   └── ResetSuccess.tsx             ← new — step 3: success card → /login
├── types/
│   └── auth.types.ts                ← + ForgotPasswordInput/Response, ResetPasswordInput/Response
└── utils/
    └── middleware.utils.ts          ← /forgot-password added to PUBLIC_ONLY_ROUTES

src/app/(auth)/forgot-password/
└── page.tsx                         ← orchestrator: hook → step title/subtitle → one of 3 components

src/i18n/{en,ar}/auth.json           ← t.auth.forgot.* + t.auth.login.forgot_link
```

The page itself owns no logic beyond picking the title/subtitle pair for the current step — all
state lives in `useForgotPassword()`.

---

## `useForgotPassword()`

```ts
const {
  step,             // 'request' | 'reset' | 'done'
  email,            // string — held here so step 2 can post it with the code
  requestForm,      // UseFormReturn<RequestCodeFormData>
  resetForm,        // UseFormReturn<ResetPasswordFormData>
  onRequestSubmit,  // RHF submit handler → POST /auth/forgot-password
  onResetSubmit,    // RHF submit handler → POST /auth/reset-password
  backToRequest,    // step 2 → step 1 ("Use a different email")
  isLoading,        // one flag — only one request can be in flight per step
  serverError,      // string | null — rendered as <ErrorAlert> above the form
} = useForgotPassword();
```

Deliberate choices:

- **The email is hook state, not a form field on step two.** The reset endpoint needs
  `{ email, code, newPassword }`, but re-typing the email invites a mismatch with the address the
  code was actually sent to.
- **Two independent Zod schemas / RHF forms**, not one wide form — step two never validates the
  email field and step one never validates the code.
- **Schemas are built inside the hook** so validation messages come from `t.auth.forgot.validation`
  and switch with the locale like everything else.
- `backToRequest()` resets step two's fields. Requesting a new code invalidates the previous one
  backend-side, so a stale draft must not survive.

### Error mapping (`toMessage`)

| Case | Message shown |
|---|---|
| No `error.response` (transport failure) | `t.auth.forgot.errors.network` |
| `429` | `t.auth.forgot.errors.rate_limited` |
| Anything else | `parseApiError(error)` — the localized `message` from the API envelope |

The backend's own messages are already generic (e.g. *"Invalid or expired reset code"*), so passing
them through leaks nothing.

---

## Validation

```ts
// step 1
email: required + valid email

// step 2
code:            required + /^\d{6}$/          → "Code must be exactly 6 digits"
newPassword:     required + min 6 chars
confirmPassword: required + must equal newPassword  (refine → path: ['confirmPassword'])
```

The code input is `inputMode="numeric"`, `maxLength={6}`, `autoComplete="one-time-code"` (so mobile
keyboards offer the SMS/email code) and is styled mono + letter-spaced to read as a code field.

---

## API Integration

| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/auth/forgot-password` | `{ email }` | Always `200` + generic message. **Rate limited: 3 req / 15 min.** Code valid 10 minutes |
| POST | `/auth/reset-password` | `{ email, code, newPassword }` | Consumes the code. **Rate limited: 5 req / min.** On success the backend revokes **every** session |

Both responses are typed `ApiResponse<{ message: string }>` — there is no payload to consume, the FE
only cares that the call resolved.

Because a successful reset invalidates all refresh tokens, step three has no "continue to
dashboard" path — the only action is *Go to sign in*.

---

## Route Protection

`/forgot-password` is added to `PUBLIC_ONLY_ROUTES` in `middleware.utils.ts`:

```ts
const PUBLIC_ONLY_ROUTES = [ROUTES.LOGIN, ROUTES.FORGOT_PASSWORD];
```

An authenticated user hitting the route is redirected to their portal — recovery is for locked-out
users, and a signed-in user has the settings flow instead. `ROUTES.FORGOT_PASSWORD` was added to
`app.constants.ts` so no route string is hardcoded.

---

## i18n Keys (`t.auth`)

```jsonc
"login": { "forgot_link": "Forgot password?" },
"forgot": {
  "back_to_login": "Back to sign in",
  "request": { "title", "subtitle", "email_label", "email_placeholder", "submit", "submitting" },
  "reset":   { "title", "notice", "subtitle" /* carries {email} */, "code_label", "code_placeholder",
               "new_password_label", "confirm_password_label", "submit", "submitting", "change_email" },
  "done":    { "title", "subtitle", "submit" },
  "validation": { "email_required", "email_invalid", "code_required", "code_invalid",
                  "password_required", "password_min", "confirm_required", "mismatch" },
  "errors":  { "network", "rate_limited", "generic" }
}
```

`reset.subtitle` contains a `{email}` placeholder filled with `.replace('{email}', email)` in the
page. AR keys added at the same time in `src/i18n/ar/auth.json`.

---

## UI Notes

- Same visual shell as the re-skinned login page: brand mark linking to `/`, `rounded-2xl` paper
  card, `ErrorAlert` above the form, full-width ink-900 submit with spinner + "…ing" copy.
- "Back to sign in" is hidden on step three (the success card already links to `/login`).
- Back-arrow icon uses `rtl:rotate-180` so the affordance points the right way in Arabic.

---

## Related

- [Authentication](auth.md) — login, middleware, token layer
- [Change Password](change-password.md) — the signed-in equivalent (also revokes all sessions)
