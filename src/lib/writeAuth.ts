import { NextResponse } from 'next/server';

/**
 * When `WRITE_TOKEN` is not set, write endpoints are open (dev default).
 * When it is set, the client must supply the matching token via one of:
 *   - `authorization: Bearer <token>`
 *   - `x-write-token: <token>`
 *   - `grim_write_token` cookie
 */
export function requireWriteAuth(req: Request): NextResponse | null {
  const expected = process.env.WRITE_TOKEN;
  if (!expected) return null;

  const auth = req.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice(7).trim()
    : '';
  const xToken = req.headers.get('x-write-token') || '';
  const cookie = req.headers.get('cookie') || '';
  const cookieToken =
    cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('grim_write_token='))
      ?.slice('grim_write_token='.length) || '';

  const provided = bearer || xToken || cookieToken;
  if (provided && timingSafeEqual(provided, expected)) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function writeAuthRequired(): boolean {
  return Boolean(process.env.WRITE_TOKEN);
}

/**
 * Server-action friendly auth check using a supplied token string.
 * Use with next/headers `cookies()` so Server Actions don't need a Request.
 */
export function isValidWriteToken(token: string | null | undefined): boolean {
  const expected = process.env.WRITE_TOKEN;
  if (!expected) return true;
  if (!token) return false;
  return timingSafeEqual(token, expected);
}
