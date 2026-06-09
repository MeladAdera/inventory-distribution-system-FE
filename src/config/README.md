# Config

Application configuration and environment variables.

## Files

### `env.ts`
Zod schema for environment variable validation.

Validates:
- `NEXT_PUBLIC_API_URL` - Backend API base URL

Runs at build time and ensures all required env vars are present.

## Usage

```typescript
import env from '@/config/env';

const apiUrl = env.NEXT_PUBLIC_API_URL;
```

## Environment Variables

See `.env.example` for required variables.

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
