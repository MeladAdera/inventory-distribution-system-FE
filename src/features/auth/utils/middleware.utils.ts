import { NextRequest } from 'next/server';
import { ROUTES } from '@/common/constants/app.constants';

// Must match the cookie name set by tokenUtils.setTokens
const AUTH_COOKIE_NAME = 'auth_token';

const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.INVENTORY,
  ROUTES.ORDERS,
  ROUTES.PRODUCTS,
  ROUTES.SHOPS,
  ROUTES.USERS,
  ROUTES.NOTIFICATIONS,
  ROUTES.AUDIT_LOGS,
];

const PUBLIC_ONLY_ROUTES = [ROUTES.LOGIN];

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isPublicOnlyRoute(pathname: string): boolean {
  return PUBLIC_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function getTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value;
}
