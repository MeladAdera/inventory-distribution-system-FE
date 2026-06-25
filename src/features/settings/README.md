# Settings Feature

Profile and shop settings for authenticated users. Used by both the admin portal (`/settings`) and the client portal (`/client/settings`).

## Structure

```
settings/
├── components/
│   ├── ProfileCard.tsx   # View/edit user name and email
│   ├── ShopCard.tsx      # View/edit shop name, address, phone
│   └── shared.tsx        # Shared UI primitives (CardHeader, CardFooter, InfoRow, FieldRow, skeletons)
├── hooks/
│   └── useSettings.ts    # useProfileSettings, useShopSettings
├── types/
│   └── settings.types.ts # ProfileCardProps, ShopCardProps, form value types
└── utils/
    └── profile.utils.ts  # getInitials, ROLE_BADGE_CLS
```

## Key Hooks

### `useProfileSettings(userId)`

Exposes a mutation to update the user's name/email. On success, syncs the Zustand auth store so the UI reflects the change immediately without a page reload.

```typescript
const { updateProfile, isUpdating } = useProfileSettings(userId);
await updateProfile({ name: 'New Name', email: 'new@email.com' });
```

### `useShopSettings(shopId)`

Fetches the shop via `GET /shops/:id` and exposes an update mutation.

```typescript
const { shop, isLoading, updateShop, isUpdating } = useShopSettings(shopId);
await updateShop({ name: 'New Name', address: '123 St', phone: '+20100000000' });
```

## API Methods Used

| Method | HTTP | Path | Purpose |
|--------|------|------|---------|
| `usersApi.update(id, data)` | PATCH | `/users/:id` | Update profile |
| `shopsApi.getById(id)` | GET | `/shops/:id` | Fetch shop data |
| `shopsApi.update(id, data)` | PATCH | `/shops/:id` | Update shop |

## Permissions

| Card | Shown to |
|------|----------|
| `ProfileCard` | All authenticated users |
| `ShopCard` | `SHOP_OWNER` only (guarded by `isShopOwner` from `usePermission`) |

## i18n

Keys live in `src/i18n/en/settings.json` and `src/i18n/ar/settings.json` under:
- `settings.profile.*` — profile card labels, role names, toast messages
- `settings.shop.*` — shop card labels, toast messages

## Usage

```typescript
import { ProfileCard } from '@/features/settings/components/ProfileCard';
import { ShopCard } from '@/features/settings/components/ShopCard';

<ProfileCard userId={user.id} name={user.name} email={user.email} role={user.role} />
{isShopOwner && user.shopId && <ShopCard shopId={user.shopId} />}
```
