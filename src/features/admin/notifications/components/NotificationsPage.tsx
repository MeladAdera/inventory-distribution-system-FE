'use client';

import { useState } from 'react';
import { AlertTriangle, Inbox, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { useNotifications, NotificationType } from '@/features/shared/notifications';
import { formatRelativeTime } from '@/common/utils/string.utils';

const PAGE_LIMIT = 20;

type Filter = 'all' | 'unread' | 'read';

const NOTIF_ICON: Record<NotificationType, typeof AlertTriangle> = {
  [NotificationType.LOW_STOCK]: AlertTriangle,
  [NotificationType.ORDER_UPDATE]: Inbox,
  [NotificationType.ORDER_CREATED]: Inbox,
  [NotificationType.ORDER_STATUS]: Inbox,
};

const NOTIF_COLOR: Record<NotificationType, string> = {
  [NotificationType.LOW_STOCK]: 'text-warning-700 bg-warning-100',
  [NotificationType.ORDER_UPDATE]: 'text-info-700 bg-info-100',
  [NotificationType.ORDER_CREATED]: 'text-info-700 bg-info-100',
  [NotificationType.ORDER_STATUS]: 'text-info-700 bg-info-100',
};

export function NotificationsPage() {
  const { t, locale } = useI18n();
  const n = t.notifications;

  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);

  const isReadParam = filter === 'unread' ? false : filter === 'read' ? true : undefined;

  const {
    items,
    total,
    totalPages,
    hasNext,
    hasPrev,
    isLoading,
    isFetching,
    markRead,
    markAllRead,
    isMarkingAllRead,
  } = useNotifications({ page, limit: PAGE_LIMIT, isRead: isReadParam });

  // Separate query for the true unread count — independent of the current filter and page.
  const { total: unreadCount } = useNotifications({ isRead: false, limit: 1 });

  function handleFilterChange(f: Filter) {
    setFilter(f);
    setPage(1);
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: n.filters.all },
    { key: 'unread', label: n.filters.unread },
    { key: 'read', label: n.filters.read },
  ];

  const emptyLabel =
    filter === 'unread'
      ? n.emptyState.unread
      : filter === 'read'
        ? n.emptyState.read
        : n.emptyState.all;

  return (
    <div className="max-w-3xl mx-auto pb-16 lg:pb-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink-900">{n.page.title}</h1>
          <p className="mt-1 text-sm text-ink-500">{n.page.subtitle}</p>
        </div>
        <button
          onClick={() => markAllRead()}
          disabled={unreadCount === 0 || isMarkingAllRead}
          className="shrink-0 h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {n.markAllRead}
        </button>
      </div>

      {/* ── Filter tabs ── */}
      <div className="inline-flex items-center bg-sand-100 border border-border rounded-full p-0.75 gap-0.5 mb-5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={cn(
              'text-[13px] font-medium px-4 py-1.25 rounded-full transition-all duration-150',
              filter === f.key
                ? 'bg-paper text-ink-900 shadow-(--shadow-xs)'
                : 'text-ink-500 hover:text-ink-700'
            )}
          >
            {f.label}
            {f.key === 'unread' && unreadCount > 0 && (
              <span className="ms-1.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-danger-700 text-paper text-[10px] font-semibold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      <div
        className={cn(
          'bg-paper border border-border rounded-xl overflow-hidden transition-opacity duration-200',
          isFetching && !isLoading && 'opacity-60'
        )}
      >
        {isLoading ? (
          <ul>
            {Array.from({ length: 8 }).map((_, i) => (
              <li
                key={i}
                className="flex items-start gap-3 px-5 py-4 border-b border-border last:border-0"
              >
                <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-3.5 w-2/5 rounded skeleton-shimmer" />
                  <div className="h-3 w-4/5 rounded skeleton-shimmer" />
                  <div className="h-2.5 w-1/4 rounded skeleton-shimmer" />
                </div>
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-sand-100 flex items-center justify-center">
              <Bell size={22} className="text-ink-400" />
            </div>
            <p className="text-[14px] text-ink-500">{emptyLabel}</p>
          </div>
        ) : (
          <ul>
            {items.map((item) => {
              const Icon = NOTIF_ICON[item.type] ?? Inbox;
              const colorClass = NOTIF_COLOR[item.type] ?? 'text-ink-400 bg-sand-100';
              return (
                <li
                  key={item.id}
                  onClick={() => !item.is_read && markRead(item.id)}
                  className={cn(
                    'flex items-start gap-3.5 px-5 py-4 border-b border-border last:border-0 transition-colors',
                    !item.is_read && 'bg-amber-50 cursor-pointer hover:bg-amber-100'
                  )}
                >
                  {/* Type icon */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                      colorClass
                    )}
                  >
                    <Icon size={15} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold text-ink-900 leading-snug">
                        {item.title}
                      </p>
                      <span
                        className={cn(
                          'text-[11px] font-medium px-2 py-px rounded-full',
                          colorClass
                        )}
                      >
                        {n.types[item.type]}
                      </span>
                    </div>
                    <p className="text-[13px] text-ink-600 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    <p className="text-[11px] font-mono text-ink-400 mt-1">
                      {formatRelativeTime(item.created_at, locale)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!item.is_read && (
                    <span className="mt-2 w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-[13px] text-ink-400 tabular-nums">
            {n.total.replace('{count}', String(total))}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!hasPrev || isFetching}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-paper text-ink-600 hover:bg-sand-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-[13px] text-ink-600 tabular-nums min-w-16 text-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext || isFetching}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-paper text-ink-600 hover:bg-sand-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
