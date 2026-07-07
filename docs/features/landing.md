# Feature: Landing Page

**Status**: ✅ Complete (UI only, no API)
**Created**: 2026-07-07
**Last Updated**: 2026-07-07

---

## Overview

A public marketing page at `/` that introduces the product before a visitor logs in. Previously `/` just redirected straight to `/dashboard`; now it renders a full scrollable landing page (hero, problem/solution, how-it-works, features, showcase, testimonials, final CTA) with links into `/login`. The login page and its layout were re-skinned to match the landing page's visual language so the transition from marketing → auth feels like one product instead of two.

This feature is presentation-only — no `api/`, `hooks/`, or `types/` layers, since there is no server data involved.

---

## Architecture

### File Structure

```
src/features/landing/
└── components/
    ├── LandingPage.tsx          # Orchestrator: stacks navbar + sections + footer
    ├── LandingNavbar.tsx        # Sticky header, anchor nav, locale toggle, login/CTA links
    ├── LandingFooter.tsx        # Footer with anchor links + login link
    ├── DashboardMockup.tsx      # Static illustrative mockup shown in the hero
    └── sections/
        ├── HeroSection.tsx
        ├── ProblemsSection.tsx
        ├── SolutionSection.tsx
        ├── HowItWorksSection.tsx
        ├── FeaturesSection.tsx
        ├── WhyUsSection.tsx
        ├── ShowcaseSection.tsx
        ├── BuiltForSection.tsx
        ├── TestimonialsSection.tsx
        └── FinalCtaSection.tsx

src/common/components/
├── Reveal.tsx                   # Scroll-triggered fade + slide-up wrapper
└── CountUp.tsx                  # Scroll-triggered animated number counter

src/app/page.tsx                 # Route `/` — now renders <LandingPage />
src/app/(auth)/layout.tsx        # Auth shell — re-skinned to match landing background
src/app/(auth)/login/page.tsx    # Re-skinned card + brand header + "back home" link
src/app/globals.css              # `scroll-behavior: smooth` for anchor-nav jumps

src/i18n/en/landing.json
src/i18n/ar/landing.json
```

### Route Change

`/` used to `redirect('/dashboard')`. It now renders `LandingPage` directly, so unauthenticated visitors land on marketing content instead of being bounced to a route the middleware would redirect to `/login` anyway. The dashboard is still only reachable via `/login` → post-auth redirect.

### Composition

`LandingPage` is a thin orchestrator — no state, no data fetching — that stacks `LandingNavbar`, the ten section components (in this order: Hero → Problems → Solution → HowItWorks → Features → WhyUs → Showcase → BuiltFor → Testimonials → FinalCta), and `LandingFooter`.

`LandingNavbar` links to in-page anchors (`#problems`, `#how-it-works`, `#features`, `#showcase`) that match `id`s set on the corresponding sections, plus a locale toggle and `/login` links (secondary "Log in" + primary "Get started" button).

---

## Shared Components (added to `src/common/components/`)

Both are generic, domain-agnostic scroll-animation atoms — no landing-specific knowledge — so they were added to `common/components` (and exported from its barrel `index.ts`) rather than kept inside the feature.

### `Reveal`

```tsx
<Reveal delay={150}>
  <DashboardMockup />
</Reveal>
```

Wraps children in an `IntersectionObserver`; once the element crosses 15% into the viewport it fades in and slides up (`opacity-0 translate-y-6` → `opacity-100 translate-y-0`) over 700ms. `delay` (ms) staggers siblings. Falls back to immediately visible when `IntersectionObserver` is unavailable (SSR/old browsers).

### `CountUp`

```tsx
<CountUp end={2400} suffix="+" />
```

Animates a `<span>` from 0 to `end` once it's 40% in view, using `requestAnimationFrame` and an ease-out-cubic curve over `durationMs` (default 1600ms). Used for stat callouts (e.g. in `WhyUsSection` / `TestimonialsSection`).

---

## i18n

New namespace: `landing`, added to both `src/i18n/en/landing.json` and `src/i18n/ar/landing.json`, and registered in `src/i18n/index.ts`.

Top-level keys (one per section, accessed as `t.landing.<key>`):

```
brand, nav, hero, problems, solution, how, features, why,
showcase, builtFor, testimonials, cta, footer
```

The login page also reads `t.landing.brand` (header logo text) and `t.landing.nav.backHome` (the "back to home" link under the login card), so the `landing` and `auth` namespaces are both loaded on `/login`.

---

## Auth Pages Re-skin

The login flow was restyled to share the landing page's visual system instead of the old plain gray card:

- **`(auth)/layout.tsx`**: swapped flat `bg-gray-50` for `bg-page` plus two blurred amber/sand glow circles (`aria-hidden`), matching the hero section's background treatment.
- **`login/page.tsx`**: added a brand header (`Boxes` icon + `t.landing.brand`) linking back to `/`; the form now sits in a rounded, shadowed `bg-paper` card using the shared `ink-900` / `amber-500` design tokens and `font-serif` headings instead of default gray Tailwind classes; inputs use the shared `.input` utility class; added an "← back home" link (`t.landing.nav.backHome`) under the card, with `rtl:rotate-180` on the arrow icon for Arabic.
- **`globals.css`**: added `html { scroll-behavior: smooth }` so the navbar's `#anchor` links (and the login page's "back home" link, when it lands on an anchored section) scroll smoothly instead of jumping.

No auth logic changed — `useLogin`, `useAuthStore`, and the redirect-if-authenticated effect are untouched.

---

## Known Issues

None.

---

## Related Features

- **[Authentication](auth.md)** — login page and layout live under `(auth)/`; this feature only restyles them, it does not touch the login hook, store, or middleware.

---

## Future Enhancements

- [ ] Wire "Get started" / hero CTAs to a signup flow if one is added (currently both point at `/login`)
- [ ] Real product screenshots in `ShowcaseSection` / `DashboardMockup` in place of the static mockup
- [ ] SEO metadata (`generateMetadata`) for the `/` route
