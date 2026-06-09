# App Router

Next.js 13+ App Router directory for pages and layouts.

## Structure

- `(auth)/` - Authentication pages (login, register)
- `(dashboard)/` - Protected dashboard pages
- `layout.tsx` - Root layout with providers
- `page.tsx` - Home page (redirects to dashboard)
- `globals.css` - Global Tailwind CSS
- `not-found.tsx` - 404 page

## Key Files

- `layout.tsx` - Wraps all pages with Providers (QueryProvider)
- `globals.css` - Tailwind directives and CSS variables

## Route Groups

- `(auth)` - Public auth routes
- `(dashboard)` - Protected dashboard routes

See [Next.js App Router docs](https://nextjs.org/docs/app) for more info.
