import { NextRequest, NextResponse } from 'next/server';
import {
  isProtectedRoute,
  isPublicOnlyRoute,
  isAdminRoute,
  isClientRoute,
  getTokenFromRequest,
  getRoleFromToken,
} from '@/features/auth/utils/middleware.utils';
import { ROUTES } from '@/common/constants/app.constants';
import { UserRole } from '@/features/auth/types/enums';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromRequest(request);

  // 1. No token on a protected route → login
  if (isProtectedRoute(pathname) && !token) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // 2. Authenticated user on login → send to the correct portal
  if (isPublicOnlyRoute(pathname) && token) {
    const role = getRoleFromToken(request);
    const dest =
      role === UserRole.SHOP_OWNER || role === UserRole.EMPLOYEE
        ? ROUTES.CLIENT_DASHBOARD
        : ROUTES.DASHBOARD;
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // 3. Role-based portal isolation
  if (token) {
    const role = getRoleFromToken(request);

    // SHOP_OWNER and EMPLOYEE must not access admin routes
    if (isAdminRoute(pathname) && (role === UserRole.SHOP_OWNER || role === UserRole.EMPLOYEE)) {
      return NextResponse.redirect(new URL(ROUTES.CLIENT_DASHBOARD, request.url));
    }

    // Only WAREHOUSE_ADMIN must not access client routes; EMPLOYEE shares the client portal
    if (isClientRoute(pathname) && role !== UserRole.SHOP_OWNER && role !== UserRole.EMPLOYEE) {
      return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
