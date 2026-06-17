# Claude Code — Project Guide

## Stack

- **Framework:** Next.js 14 (App Router, `'use client'` where needed)
- **State:** Zustand (auth store), TanStack Query (server state)
- **Forms:** React Hook Form + Zod
- **HTTP:** Axios via `src/common/api/client.ts` (token injection + 401 refresh interceptor)
- **UI:** shadcn/ui primitives + custom Tailwind design tokens
- **i18n:** `src/i18n/en/*.json` + `src/i18n/ar/*.json`, assembled in `src/i18n/index.ts`

## Feature folder structure

Every feature follows this layout. Use it for every new page, not just the ones already built.

```
src/features/<feature>/
  types/
    <feature>.types.ts        ← interfaces + enums only; no logic
  api/
    <feature>.api.ts          ← raw Axios calls, returns response.data
  hooks/
    use<Feature>.ts           ← TanStack Query + mutations; exposes clean return value
  components/
    <ui-atoms>/               ← small, domain-aware sub-components (no data fetching)
    <FeaturePage>.tsx         ← thin orchestrator: wires hook → sub-components
  validations/
    <feature>.schema.ts       ← Zod schemas (if the feature has forms)
```

### Rules for each layer

| Layer | Allowed to | Must NOT |
|---|---|---|
| `types/` | Define interfaces, enums, derived types | Contain logic or imports from other layers |
| `api/` | Call `apiClient`, map raw response | Know about React, state, or UI |
| `hooks/` | Call API functions, run `useQuery` / `useMutation`, compute derived state with `useMemo` | Render JSX or import UI components |
| `components/<atoms>/` | Receive props, render UI, read i18n | Fetch data, call API directly |
| `<FeaturePage>.tsx` | Call hooks, manage local UI state (`useState`), pass props down | Contain styling logic or inline data fetching |

### Generic atoms go to `src/common/components/`

If a component has **zero domain knowledge** (e.g. `Stepper`, `Badge`, `Modal`), it lives in `common/components/` so any feature can reuse it.

## i18n

- Language-first folder: `src/i18n/en/<namespace>.json` + `src/i18n/ar/<namespace>.json`
- Assembled in `src/i18n/index.ts` — add new namespaces there when you create them
- Access in components: `const { t, locale, dir } = useI18n()`
- Always add both EN and AR keys at the same time

## API integration pattern

1. **Add types** to `types/<feature>.types.ts`
2. **Add API call** to `api/<feature>.api.ts` (thin wrapper, returns `response.data`)
3. **Add hook** in `hooks/use<Feature>.ts` — handles loading, error, and mutations
4. **Wire into page** — page imports the hook and passes data down as props

The hook computes all derived state (e.g. `status` field from `qty` vs `threshold`) so
sub-components receive clean, typed props and never repeat derivation logic.

## Commit style

```
feat(<scope>): short description
refactor(<scope>): short description
fix(<scope>): short description
```

Scopes in use: `client-portal`, `admin`, `auth`, `inventory`, `orders`, `docs`, `app`

## Workflow per page

1. Build the page with mock data first to validate UI
2. Integrate real API (replace mock imports with hook)
3. Apply separation of concerns (types → api → hook → components → page)
4. Add/update i18n keys in both EN and AR
5. Commit with a scoped message

## Backend base URL

```
http://localhost:3000
Swagger docs: http://localhost:3000/api
```

Auth: JWT `accessToken` (15 min) + `refreshToken` (30 days). The Axios interceptor in
`src/common/api/client.ts` handles token injection and 401 → refresh → retry automatically.
