import { NextRequest } from 'next/server';
import { ROUTES } from '@/common/constants/app.constants';
import { UserRole } from '@/features/auth/types/enums';

// Must match the cookie name set by tokenUtils.setTokens
const AUTH_COOKIE_NAME = 'auth_token';

const ADMIN_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.PROFIT,
  ROUTES.INVENTORY,
  ROUTES.ORDERS,
  ROUTES.PRODUCTS,
  ROUTES.SHOPS,
  ROUTES.USERS,
  ROUTES.NOTIFICATIONS,
  ROUTES.AUDIT_LOGS,
];

const PUBLIC_ONLY_ROUTES = [ROUTES.LOGIN];

// Routes an EMPLOYEE may access inside the client portal. Everything else
// under /client/* redirects to the dashboard for this role.
const EMPLOYEE_ALLOWED_ROUTES = [
  ROUTES.CLIENT_DASHBOARD,
  ROUTES.CLIENT_INVENTORY,
  ROUTES.CLIENT_SELL,
];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function isProtectedRoute(pathname: string): boolean {
  return (
    matchesRoute(pathname, ADMIN_ROUTES) ||
    pathname === ROUTES.CLIENT_ROOT ||
    pathname.startsWith(`${ROUTES.CLIENT_ROOT}/`)
  );
}

export function isAdminRoute(pathname: string): boolean {
  return matchesRoute(pathname, ADMIN_ROUTES);
}

export function isClientRoute(pathname: string): boolean {
  return pathname === ROUTES.CLIENT_ROOT || pathname.startsWith(`${ROUTES.CLIENT_ROOT}/`);
}

export function isEmployeeAllowedRoute(pathname: string): boolean {
  return matchesRoute(pathname, EMPLOYEE_ALLOWED_ROUTES);
}

export function isPublicOnlyRoute(pathname: string): boolean {
  return PUBLIC_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function getTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value;
}

export function getRoleFromToken(request: NextRequest): UserRole | undefined {
  const token = getTokenFromRequest(request);
  if (!token) return undefined;
  try {
    // JWT payload is base64url-encoded — normalise before decoding
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { role?: string };
    return payload.role as UserRole | undefined;
  } catch {
    return undefined;
  }
}
