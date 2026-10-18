import { NotificationType } from '../types/notifications.types';
import type { Notification } from '../types/notifications.types';

/**
 * Where a notification takes you when you click it.
 *
 * The backend stores what the notification is *about* in `args`:
 * order notifications carry `{ orderId }`, low-stock carries `{ productName }`
 * (there is no product id in the payload — the name is what we can filter by).
 *
 * `pathname` decides which portal the link belongs to, so the same notification
 * row works from the admin shell and the shop shell without a second mapping.
 * Returns `null` when the payload has nothing to open — the row is then plain
 * text and clicking it only marks it read.
 */
export function notificationHref(notification: Notification, pathname: string): string | null {
  const base = pathname.startsWith('/client') ? '/client' : '';
  const args = notification.args ?? {};

  switch (notification.type) {
    case NotificationType.ORDER_CREATED:
    case NotificationType.ORDER_STATUS:
    case NotificationType.ORDER_UPDATE: {
      const orderId = Number(args.orderId);
      return Number.isInteger(orderId) && orderId > 0 ? `${base}/orders?order=${orderId}` : null;
    }

    case NotificationType.LOW_STOCK: {
      const productName = typeof args.productName === 'string' ? args.productName.trim() : '';
      return productName ? `${base}/inventory?product=${encodeURIComponent(productName)}` : null;
    }

    default:
      return null;
  }
}
