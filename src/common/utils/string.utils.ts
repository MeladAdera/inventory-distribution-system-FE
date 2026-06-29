// Returns up to two initials from a full name (first + last word). Used in avatar circles.
export function getInitials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? '').toUpperCase();
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

// Converts an ISO date string to a localized relative label ("2 minutes ago" / "منذ دقيقتين").
// Uses Intl.RelativeTimeFormat so Arabic grammar (dual/plural) is handled natively.
export function formatRelativeTime(dateStr: string, locale: 'en' | 'ar'): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diffMin < 1) return rtf.format(-diffSec, 'second');
  if (diffHour < 1) return rtf.format(-diffMin, 'minute');
  if (diffDay < 1) return rtf.format(-diffHour, 'hour');
  return rtf.format(-diffDay, 'day');
}
