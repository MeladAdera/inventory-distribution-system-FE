# Notifications Feature

Read-only notifications for low-stock alerts and order updates. No create/update forms — only mark-read actions.

## Structure

```
notifications/
├── api/
│   └── notifications.api.ts      # API calls
├── hooks/
│   └── useNotifications.ts       # List query + markRead/markAllRead mutations + unreadCount
├── types/
│   └── notifications.types.ts    # NotificationType, Notification, NotificationListParams
└── index.ts                      # Barrel exports
```

## Key Types

- `NotificationType` — `LOW_STOCK` | `ORDER_UPDATE`
- `Notification` — `user_id` is `null` for system-wide notifications
- `NotificationListParams` — supports `isRead?: boolean` to filter unread-only from backend

## API Methods

| Method | HTTP | Path |
|--------|------|------|
| `list(params?)` | GET | `/notifications` |
| `markRead(id)` | PATCH | `/notifications/:id/read` |
| `markAllRead()` | PATCH | `/notifications/read-all` |

## `unreadCount`

Derived in the hook from the list data — no extra API call needed. The hook handles both flat and paginated response shapes:

```ts
const items = data?.data?.data ?? data?.data ?? [];
const unreadCount = items.filter(n => !n.is_read).length;
```

## Usage

```typescript
import { useNotifications } from '@/features/notifications';

// Navbar bell icon
const { unreadCount } = useNotifications();

// Notifications page
const { items, isLoading, markRead, markAllRead } = useNotifications({ page: 1, limit: 20 });
```
