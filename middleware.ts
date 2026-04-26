import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  authDisabled,
  isAuthConfigured,
  isProdWriteAuthMisconfigured,
  SESSION_COOKIE,
  verifySessionToken,
} from '@/lib/session';

export async function middleware(req: NextRequest) {
  if (isProdWriteAuthMisconfigured()) {
    return new NextResponse(
      'Authentication is not configured for this deployment. Set AUTH_SECRET and a password (or hash), or ALLOW_UNAUTHENTICATED_WRITES=1 if intentional.',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }
    );
  }
  if (authDisabled() || !isAuthConfigured()) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = token ? await verifySessionToken(token) : false;
  if (ok) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('next', `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

function isProtectedPath(pathname: string): boolean {
  if (pathname === '/admin' || pathname === '/new') return true;
  return /^\/statblock\/[^/]+\/edit$/.test(pathname);
}

export const config = {
  matcher: ['/admin', '/new', '/statblock/:id/edit'],
};
