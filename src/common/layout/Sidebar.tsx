'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Warehouse, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { useSidebarStore } from './sidebarStore';
import { NAV_MAIN, NAV_MANAGE, type NavItem } from './navConfig';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0][0] ?? '').toUpperCase();
  return (parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '');
}

interface SidebarProps {
  /** fluid = no collapse toggle; used inside NavDrawer */
  fluid?: boolean;
}

export function Sidebar({ fluid = false }: SidebarProps) {
  const { t, dir } = useI18n();
  const { isCollapsed, toggle } = useSidebarStore();
  const pathname = usePathname();

  const collapsed = !fluid && isCollapsed;
  const isRtl = dir === 'rtl';

  const CollapseIcon = collapsed
    ? isRtl
      ? ChevronsRight
      : ChevronsLeft
    : isRtl
      ? ChevronsLeft
      : ChevronsRight;

  const nav = t.sidebar.nav as Record<string, string>;
  const displayName = t.sidebar.user.defaultName;
  const initials = getInitials(displayName);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen bg-sand-100 border-e border-border shrink-0',
        'transition-[width] duration-220 ease-[cubic-bezier(0.2,0,0,1)]',
        collapsed ? 'w-18' : 'w-65'
      )}
    >
      {/* ── Brand ─────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center border-b border-border shrink-0',
          collapsed ? 'h-16 justify-center' : 'h-16 gap-3 px-4.5'
        )}
      >
        <div className="w-8.5 h-8.5 rounded-lg bg-ink-900 flex items-center justify-center shrink-0">
          <Warehouse size={19} className="text-amber-500" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-serif text-[19px] font-semibold leading-[1.1] text-ink-900 truncate">
              {t.sidebar.brand.name}
            </p>
            <p className="text-[11px] text-ink-600 truncate">{t.sidebar.brand.sub}</p>
          </div>
        )}
      </div>

      {/* ── Navigation ────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.75">
        <NavSection
          label={collapsed ? undefined : t.sidebar.sections.main}
          items={NAV_MAIN}
          pathname={pathname}
          collapsed={collapsed}
          nav={nav}
        />

        <div className="my-2" />

        <NavSection
          label={collapsed ? undefined : t.sidebar.sections.manage}
          items={NAV_MANAGE}
          pathname={pathname}
          collapsed={collapsed}
          nav={nav}
        />
      </nav>

      {/* ── Collapse toggle ───────────────────────── */}
      {!fluid && (
        <div className="px-3 pb-2">
          <button
            onClick={toggle}
            className={cn(
              'flex items-center gap-2 w-full rounded-lg px-3 py-2 text-[14px] font-medium text-ink-600',
              'hover:bg-sand-200 transition-colors',
              collapsed && 'justify-center px-0'
            )}
            aria-label={t.sidebar.collapse}
          >
            <CollapseIcon size={16} className="shrink-0" />
            {!collapsed && <span>{t.sidebar.collapse}</span>}
          </button>
        </div>
      )}

      {/* ── User block ────────────────────────────── */}
      <div
        className={cn(
          'flex items-center border-t border-border shrink-0 p-3',
          collapsed ? 'justify-center' : 'gap-3'
        )}
      >
        <div className="w-8.5 h-8.5 rounded-full bg-ink-900 flex items-center justify-center shrink-0">
          <span className="text-[13px] font-semibold text-amber-500">{initials}</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0">
            <p className="text-[13px] font-medium text-ink-900 truncate">{displayName}</p>
            <p className="text-[11px] text-ink-600 truncate">{t.sidebar.user.role}</p>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─── NavSection ──────────────────────────────────────────── */

interface NavSectionProps {
  label?: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  nav: Record<string, string>;
}

function NavSection({ label, items, pathname, collapsed, nav }: NavSectionProps) {
  return (
    <div className="flex flex-col gap-0.75">
      {label && (
        <p className="px-3 pt-1 pb-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-400 select-none">
          {label}
        </p>
      )}
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? (nav[item.id] ?? item.id) : undefined}
            className={cn(
              'relative flex items-center rounded-lg transition-colors',
              collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.25',
              active
                ? 'bg-sand-200 text-ink-900'
                : 'text-ink-600 hover:bg-sand-200 hover:text-ink-900'
            )}
          >
            {/* Active pill indicator */}
            {active && (
              <span
                className="absolute top-1/2 -translate-y-1/2 w-0.75 h-5.5 rounded-full bg-amber-600"
                style={{ insetInlineStart: '-12px' }}
              />
            )}

            <Icon size={18} className="shrink-0" />

            {!collapsed && (
              <>
                <span className="flex-1 text-[14px] font-medium">{nav[item.id] ?? item.id}</span>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'font-mono text-[11px] px-1.75 py-px rounded-full',
                      item.badgeVariant === 'danger'
                        ? 'bg-danger-100 text-danger-700'
                        : 'bg-paper border border-border text-ink-500'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
