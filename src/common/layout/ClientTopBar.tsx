'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, Languages, ChevronDown, LogOut, Bell, AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { getInitials, formatRelativeTime } from '@/common/utils/string.utils';
import { useI18n } from '@/providers/I18nProvider';
import { useAuth } from '@/features/auth';
import { useNotifications, NotificationType } from '@/features/shared/notifications';

const NOTIF_ICON: Record<NotificationType, typeof AlertTriangle> = {
  [NotificationType.LOW_STOCK]: AlertTriangle,
  [NotificationType.ORDER_UPDATE]: Inbox,
  [NotificationType.ORDER_CREATED]: Inbox,
  [NotificationType.ORDER_STATUS]: Inbox,
};

const NOTIF_COLOR: Record<NotificationType, string> = {
  [NotificationType.LOW_STOCK]: 'text-warning-700',
  [NotificationType.ORDER_UPDATE]: 'text-info-700',
  [NotificationType.ORDER_CREATED]: 'text-info-700',
  [NotificationType.ORDER_STATUS]: 'text-info-700',
};

interface ClientTopBarProps {
  onMenuClick?: () => void;
}

export function ClientTopBar({ onMenuClick }: ClientTopBarProps) {
  const { t, locale, setLocale } = useI18n();
  const { logout } = useAuth();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const {
    items: notifications,
    unreadCount,
    markRead,
    markAllRead,
  } = useNotifications({ limit: 20 });

  const c = t.client;
  const nav = c.nav as Record<string, string>;

  // resolve page title from the 3rd path segment: /client/<page>
  const segments = pathname.split('/').filter(Boolean);
  const pageKey = segments[1] ?? 'dashboard';
  const pageTitle = nav[pageKey] ?? '';

  const { user } = useAuth();
  const clientName = user?.name ?? '';
  const roleLabel = user
    ? ((t.settings.profile.roles as Record<string, string>)[user.role] ?? user.role)
    : '';
  const initials = getInitials(clientName);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const nt = c.topbar.notifications;

  return (
    <header className="h-16 bg-page border-b border-border flex items-center px-6 gap-4 shrink-0 sticky top-0 z-100">
      {/* Hamburger — tablet only */}
      <button
        onClick={onMenuClick}
        className="hidden md:block lg:hidden p-2.5 rounded-lg text-ink-800 hover:bg-sand-100 transition-colors"
        aria-label={c.topbar.menuLabel}
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <h1 className="text-[22px] font-semibold text-ink-900 shrink-0">{pageTitle}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          className="h-9 px-3.5 rounded-full border border-border text-[13px] font-semibold text-ink-700 hover:bg-sand-100 transition-colors flex items-center gap-1.5"
        >
          <Languages size={14} />
          {c.topbar.langSwitchLabel}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setAvatarOpen(false);
            }}
            className="relative w-9.5 h-9.5 rounded-full border border-border bg-paper flex items-center justify-center text-ink-700 hover:bg-sand-100 transition-colors"
            aria-label={nt.title}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 inset-e-1 min-w-4 h-4 px-1 rounded-full bg-danger-700 text-paper text-[10px] font-semibold flex items-center justify-center border-2 border-page">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-[calc(100%+8px)] inset-e-0 z-50 w-90 bg-paper border border-border rounded-xl animate-pop-in shadow-(--shadow-md)">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                <span className="text-[14px] font-semibold text-ink-900">{nt.title}</span>
                <button
                  onClick={() => markAllRead()}
                  disabled={unreadCount === 0}
                  className="text-[13px] font-medium text-amber-700 hover:underline disabled:opacity-40"
                >
                  {nt.markAllRead}
                </button>
              </div>

              {/* Items */}
              <ul className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-[13px] text-ink-400">
                    {nt.emptyState}
                  </li>
                ) : (
                  notifications.map((n) => {
                    const Icon = NOTIF_ICON[n.type] ?? Inbox;
                    const color = NOTIF_COLOR[n.type] ?? 'text-ink-400';
                    return (
                      <li
                        key={n.id}
                        onClick={() => !n.is_read && markRead(n.id)}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 border-b border-border last:border-0',
                          !n.is_read && 'bg-amber-50 cursor-pointer hover:bg-amber-100'
                        )}
                      >
                        <Icon size={18} className={cn('mt-0.5 shrink-0', color)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-ink-800 leading-normal truncate">
                            {n.title}
                          </p>
                          <p className="text-[12px] text-ink-600 leading-normal mt-0.5">
                            {n.message}
                          </p>
                          <p className="font-mono text-[11px] text-ink-400 mt-0.5">
                            {formatRelativeTime(n.created_at, locale)}
                          </p>
                        </div>
                        {!n.is_read && (
                          <span className="mt-1.5 w-1.75 h-1.75 rounded-full bg-amber-600 shrink-0" />
                        )}
                      </li>
                    );
                  })
                )}
              </ul>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border text-center">
                <Link
                  href="/client/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-[13px] text-amber-700 hover:underline"
                >
                  {nt.viewAll}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar + logout dropdown — hidden on mobile */}
        <div className="relative hidden md:block" ref={avatarRef}>
          <button
            onClick={() => setAvatarOpen((v) => !v)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-sand-100 transition-colors"
            aria-label={c.topbar.accountLabel}
          >
            <div className="w-8.5[34px] rounded-full bg-amber-600 flex items-center justify-center">
              <span className="text-[13px] font-semibold text-ink-900">{initials}</span>
            </div>
            <ChevronDown size={14} className="text-ink-400" />
          </button>

          {avatarOpen && (
            <div
              className={cn(
                'absolute top-[calc(100%+8px)] inset-e-0 z-50 w-52',
                'bg-paper border border-border rounded-xl shadow-(--shadow-md) animate-pop-in'
              )}
            >
              {/* User info */}
              <div className="px-3 py-3 border-b border-border">
                <p className="text-[14px] font-semibold text-ink-900 truncate">{clientName}</p>
                <p className="text-[12px] text-ink-500 truncate">{roleLabel}</p>
              </div>

              {/* Logout */}
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setAvatarOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.25 rounded-lg text-[14px] text-danger-700 hover:bg-danger-100 transition-colors"
                >
                  <LogOut size={16} className="shrink-0" />
                  {c.topbar.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
