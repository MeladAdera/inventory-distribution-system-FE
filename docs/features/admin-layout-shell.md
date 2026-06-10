# Feature Documentation: Admin Layout Shell

**Status**: Complete  
**Created Date**: 2026-06-10  
**Last Updated**: 2026-06-10  
**Assignee**: Melad Adera

---

## 📋 Overview

### Purpose
The Admin Layout Shell is the persistent wrapper that surrounds every dashboard page. It provides the navigation structure, branding, user context, and internationalization (AR/EN) for the entire admin area.

### Business Value
Gives warehouse operators a consistent, responsive navigation experience on any device — desktop with a full sidebar, tablet with a slide-in drawer, and mobile with a bottom navigation bar. The Arabic-first design aligns with the target user base while supporting English via a one-click language toggle.

### Key Stakeholders
All authenticated users: `WAREHOUSE_ADMIN`, `SHOP_OWNER`, `EMPLOYEE`.

---

## 🎯 Requirements

### Functional Requirements
- [x] Persistent sidebar on desktop (≥ 1024 px) with collapse toggle
- [x] Overlay drawer on tablet (768–1023 px) triggered by hamburger
- [x] Fixed bottom navigation on mobile (≤ 767 px) with "More" sheet
- [x] AR/EN language toggle that switches direction (`rtl` ↔ `ltr`) without a page reload
- [x] Active route highlighted with amber pill indicator
- [x] Notification bell showing unread count badge
- [x] Notification dropdown with per-type icons and unread dot
- [x] Avatar dropdown with profile, client portal, and logout
- [x] Search box visible on desktop only
- [x] Page title derived from the current route

### Non-Functional Requirements
- [x] Sidebar width transition: `220ms cubic-bezier(0.2, 0, 0, 1)`
- [x] Zero dependency on `react-i18next` or any external i18n library
- [x] All CSS values from the design token system (no raw hex codes in components)

---

## 🏗 Architecture

### File Structure

```
src/
├── i18n/
│   ├── index.ts                  # Assembles all locale JSON → typed translations object
│   ├── en/
│   │   ├── sidebar.json
│   │   ├── topbar.json
│   │   └── bottomnav.json
│   └── ar/
│       ├── sidebar.json
│       ├── topbar.json
│       └── bottomnav.json
│
├── providers/
│   └── I18nProvider.tsx          # React context: locale, setLocale, t, dir
│
└── common/layout/
    ├── navConfig.ts              # Single source of truth for nav items + icons + badges
    ├── sidebarStore.ts           # Zustand store: isCollapsed, toggle, setCollapsed
    ├── mockNotifications.ts      # Typed mock notification data (AR + EN text)
    ├── Sidebar.tsx               # Warm-theme desktop sidebar (260 px / 72 px collapsed)
    ├── TopBar.tsx                # Sticky header: title, search, lang toggle, bell, avatar
    ├── NavDrawer.tsx             # Tablet overlay drawer — reuses <Sidebar fluid>
    ├── BottomNav.tsx             # Mobile fixed bottom nav (4 items + More)
    ├── BottomSheet.tsx           # Generic bottom sheet (sm | full)
    ├── DashboardLayout.tsx       # Shell composer — renders all of the above
    └── index.ts                  # Barrel exports
```

### Component Hierarchy

```
DashboardLayout
├── Sidebar            (lg: always visible, collapsible)
├── TopBar             (sticky, full-width)
│   ├── NotificationDropdown
│   └── AvatarDropdown
├── NavDrawer          (< lg, reuses Sidebar in fluid mode)
├── BottomNav          (< lg mobile only)
└── BottomSheet        (mobile "More" menu)
```

---

## 🎨 Design Tokens Used

All tokens are defined in `src/app/globals.css` under `@theme`.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-sand-100` | `#F5EFE4` | Sidebar background (warm theme) |
| `--color-sand-200` | `#ECE3D2` | Active nav item background, hover |
| `--color-ink-900` | `#0E1B2C` | Logo container, avatar bg, primary text |
| `--color-amber-500` | `#F59E0B` | Logo icon, avatar initials text |
| `--color-amber-600` | `#D97706` | Active nav pill indicator |
| `--color-amber-700` | `#B45309` | TopBar links (mark all read, view all) |
| `--color-danger-700` | `#A8312B` | Notification badge, shortages badge |
| `--color-border` | `#E8E2D6` | All borders |
| `--color-page` | `#FBF8F3` | TopBar + main content background |
| `--color-paper` | `#FFFFFF` | Search box, notification dropdown, bell bg |

Notification icon colors:
| Type | Icon | Token |
|------|------|-------|
| `out` | `XCircle` | `--color-danger-700` |
| `low` | `AlertTriangle` | `--color-warning-700` |
| `request` | `Inbox` | `--color-info-700` |
| `done` | `CheckCircle` | `--color-success-700` |

---

## 🌐 Internationalisation (i18n)

### Approach
Custom React 18 context — no external library. The `I18nProvider` holds the `locale` state and exposes `useI18n()`.

```ts
const { locale, setLocale, t, dir } = useI18n();
// locale: 'ar' | 'en'
// dir:    'rtl' | 'ltr'
// t:      { sidebar: {...}, topbar: {...}, bottomnav: {...} }
```

On every locale change the provider updates `document.documentElement.dir` and `document.documentElement.lang` so CSS logical properties (e.g. `inset-inline-start`, `border-e`) respond automatically without a page reload.

### Default locale
Arabic (`ar` / `rtl`). The `<html>` element in `app/layout.tsx` is statically set to `dir="rtl" lang="ar"` as the server-rendered default.

### Language toggle
The TopBar button toggles between `ar` and `en`. The button label is driven by the translation file: `t.topbar.langSwitchLabel` ("EN" in AR mode, "ع" in EN mode).

### Translation file structure

```
src/i18n/{locale}/sidebar.json    → brand, sections, nav labels, collapse, user
src/i18n/{locale}/topbar.json     → search placeholder, lang label, user, notifications, avatar, pageTitles
src/i18n/{locale}/bottomnav.json  → nav labels (compact)
```

---

## 📐 Responsive Behaviour

| Breakpoint | Tailwind | Sidebar | Hamburger | Search | Bottom nav |
|-----------|----------|---------|-----------|--------|------------|
| Mobile `< 768 px` | default | hidden | visible (`lg:hidden`) | hidden | visible (`lg:hidden`) |
| Tablet `768–1023 px` | `md:` | hidden | visible | hidden | hidden |
| Desktop `≥ 1024 px` | `lg:` | visible (`hidden lg:flex`) | hidden | visible (`hidden lg:flex`) | hidden |

---

## 🧩 Component API

### `<Sidebar fluid?>`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fluid` | `boolean` | `false` | Hides collapse toggle; used inside `NavDrawer` |

State from `useSidebarStore`: `isCollapsed`, `toggle`, `setCollapsed`.

### `<TopBar onMenuClick?>`
| Prop | Type | Description |
|------|------|-------------|
| `onMenuClick` | `() => void` | Called when hamburger is clicked — opens `NavDrawer` |

### `<NavDrawer open onClose>`
| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Whether the drawer is visible |
| `onClose` | `() => void` | Called on backdrop click or close button |

### `<BottomNav onMoreClick?>`
| Prop | Type | Description |
|------|------|-------------|
| `onMoreClick` | `() => void` | Opens the "More" `BottomSheet` |

### `<BottomSheet open onClose title? size? className?>`
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Visibility |
| `onClose` | `() => void` | — | Close handler |
| `title` | `string` | — | Optional header text |
| `size` | `'sm' \| 'full'` | `'sm'` | `full` fills the whole screen |

### `navConfig.ts` exports
```ts
NAV_ITEMS   // all 6 items
NAV_MAIN    // dashboard, products, clients, transfers (badge:8), shortages (badge:5)
NAV_MANAGE  // settings
```

### `useSidebarStore`
```ts
const { isCollapsed, toggle, setCollapsed } = useSidebarStore();
```

---

## 🔄 Data Flow

```
I18nProvider (context)
  └── provides: locale, t, dir, setLocale
       ├── Sidebar        reads t.sidebar.*
       ├── TopBar         reads t.topbar.*, calls setLocale on toggle
       ├── NavDrawer      reads dir (for RTL translate direction)
       └── BottomNav      reads t.bottomnav.*

useSidebarStore (Zustand)
  └── isCollapsed state
       ├── Sidebar   reads + toggles
       └── (future) any component can read width
```

---

## ✅ Acceptance Criteria

- [x] Desktop: Sidebar visible, collapsible to icon-only mode; pill indicator on active route
- [x] Tablet: Sidebar hidden; hamburger opens warm-theme drawer from inline-start edge
- [x] Mobile: Sidebar and drawer hidden; fixed bottom nav with amber active color
- [x] Language toggle switches AR ↔ EN; `dir` attribute updates on `<html>` without reload
- [x] Notification bell shows unread count; dropdown lists items with correct icons per type
- [x] Avatar dropdown shows name/role, has logout that calls `useAuth().logout()`
- [x] Page title in TopBar reflects the current route using translation keys
- [x] No `react-i18next` imports anywhere in layout files
- [x] TypeScript: `npx tsc --noEmit` passes with zero errors

---

## 🚧 Known Limitations / Future Work

- **IBM Plex Serif font** — brand name uses `font-serif` (system fallback). Load IBM Plex Serif via `next/font/google` when font budget is confirmed.
- **Mock notifications** — The bell dropdown uses `mockNotifications.ts`. Replace with `useNotifications()` hook from `features/notifications` once TICKET-049 lands.
- **More sheet** — `BottomSheet` for mobile "More" is wired but body content is a placeholder. Populate with Transfers, Settings, Client Portal, and logout (TICKET-049 follow-up).
- **Sidebar theme toggle** — Ink (dark) theme is spec'd but not exposed as a prop. Add a `theme` prop to `Sidebar` when dark mode support is required.
- **Role-based nav** — TICKET-052 will filter `NAV_ITEMS` by `user.role`. The current implementation shows all items to all roles.
