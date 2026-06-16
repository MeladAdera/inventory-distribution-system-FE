'use client';

import { usePathname } from 'next/navigation';
import { Warehouse, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { getInitials } from '@/common/utils/string.utils';
import { useI18n } from '@/providers/I18nProvider';
import { useAuth } from '@/features/auth';
import { useSidebarStore } from './sidebarStore';
import { NAV_MAIN, NAV_MANAGE } from './navConfig';
import { NavSection } from './SidebarNavSection';

interface SidebarProps {
  /** fluid = no collapse toggle; used inside NavDrawer */
  fluid?: boolean;
}

export function Sidebar({ fluid = false }: SidebarProps) {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const { isCollapsed, toggle } = useSidebarStore();
  const pathname = usePathname();

  const collapsed = !fluid && isCollapsed;
  const isRtl = dir === 'rtl';

  const nav = t.sidebar.nav as Record<string, string>;
  const roles = t.sidebar.user.roles as Record<string, string>;
  const displayName = user?.name ?? '';
  const roleLabel = user?.role ? (roles[user.role] ?? user.role) : '';
  const initials = getInitials(displayName);

  const CollapseIcon = collapsed
    ? isRtl
      ? ChevronsRight
      : ChevronsLeft
    : isRtl
      ? ChevronsLeft
      : ChevronsRight;

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen bg-sand-100 border-e border-border shrink-0',
        'transition-[width] duration-220 ease-[cubic-bezier(0.2,0,0,1)]',
        collapsed ? 'w-18' : 'w-65'
      )}
    >
      {/* ── Brand ── */}
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

      {/* ── Navigation ── */}
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

      {/* ── Collapse toggle ── */}
      {!fluid && (
        <div className="px-3 pb-2">
          <button
            onClick={toggle}
            aria-label={t.sidebar.collapse}
            className={cn(
              'flex items-center gap-2 w-full rounded-lg px-3 py-2 text-[14px] font-medium text-ink-600 hover:bg-sand-200 transition-colors',
              collapsed && 'justify-center px-0'
            )}
          >
            <CollapseIcon size={16} className="shrink-0" />
            {!collapsed && <span>{t.sidebar.collapse}</span>}
          </button>
        </div>
      )}

      {/* ── User block ── */}
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
            <p className="text-[11px] text-ink-600 truncate">{roleLabel}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
