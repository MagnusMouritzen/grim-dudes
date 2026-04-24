import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { limitLogin } from '@/lib/rateLimit';
import {
  isAuthConfigured,
  safeRedirectPath,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  signSessionToken,
  timingSafeEqualString,
} from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function verifyPassword(plain: string): Promise<boolean> {
  const hash = process.env.AUTH_PASSWORD_HASH;
  if (hash && hash.length > 0) {
    return bcrypt.compare(plain, hash);
  }
  const p = process.env.AUTH_PASSWORD;
  if (!p) return false;
  return timingSafeEqualString(plain, p);
}

export async function POST(req: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }

  const limit = await limitLogin(req);
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  let body: { username?: string; password?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const expectedUser = process.env.AUTH_USER?.trim();
  if (expectedUser) {
    const u = typeof body.username === 'string' ? body.username : '';
    if (!timingSafeEqualString(u, expectedUser)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (!password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = await verifyPassword(password);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const jwt = await signSessionToken();
  const res = NextResponse.json({
    ok: true,
    redirect: safeRedirectPath(body.next),
  });
  res.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  });
  return res;
}
