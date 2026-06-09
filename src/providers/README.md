# Providers

Context providers that wrap the entire application.

## Files

### `QueryProvider.tsx`
React Query (TanStack Query) provider.

Configuration:
- `staleTime`: 5 minutes
- `gcTime`: 10 minutes (formerly cacheTime)
- `retry`: 3 attempts
- `retryDelay`: Exponential backoff

### `index.tsx`
Barrel export combining all providers.

Usage in root layout:
```typescript
import { Providers } from '@/providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Adding New Providers

1. Create new provider file (e.g., `ThemeProvider.tsx`)
2. Add to `index.tsx` in Providers component
3. Wrap in root layout

Example:
```typescript
// src/providers/NewProvider.tsx
export function NewProvider({ children }) {
  return <Context.Provider value={{}}>{children}</Context.Provider>;
}

// src/providers/index.tsx
export function Providers({ children }) {
  return (
    <QueryProvider>
      <NewProvider>{children}</NewProvider>
    </QueryProvider>
  );
}
```
