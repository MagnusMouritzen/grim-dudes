import { NextResponse } from 'next/server';
import { verifyRequestSession, writesRequireAuth } from '@/lib/session';

/**
 * When auth is not configured or AUTH_DISABLED is set, mutations are allowed
 * (local / open deploy). Otherwise requires a valid `grim_session` cookie.
 */
export async function requireWriteAuth(req: Request): Promise<NextResponse | null> {
  if (!writesRequireAuth()) return null;
  const ok = await verifyRequestSession(req);
  if (ok) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/** True when mutating API routes and server actions enforce session auth. */
export function writeAuthRequired(): boolean {
  return writesRequireAuth();
}
