import { NextRequest, NextResponse } from 'next/server';
import {
  isProtectedRoute,
  isPublicOnlyRoute,
  getTokenFromRequest,
} from '@/features/auth/utils/middleware.utils';
import { ROUTES } from '@/common/constants/app.constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromRequest(request);

  if (isProtectedRoute(pathname) && !token) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  if (isPublicOnlyRoute(pathname) && token) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
