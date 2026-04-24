import { SignJWT, jwtVerify } from 'jose';

/** `cookies()` store from `next/headers` (typed minimally for lib boundaries). */
export type SessionCookieStore = {
  get(name: string): { value: string } | undefined;
};

export const SESSION_COOKIE = 'grim_session';

/** Default session lifetime (seconds). */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14;

const ISS = 'grim-dudes';
const AUD = 'grim-dudes-web';

export function authDisabled(): boolean {
  const v = process.env.AUTH_DISABLED;
  return v === '1' || v === 'true';
}

export function isAuthConfigured(): boolean {
  const secret = process.env.AUTH_SECRET?.trim();
  const hasPassword =
    Boolean(process.env.AUTH_PASSWORD_HASH?.length) ||
    Boolean(process.env.AUTH_PASSWORD?.length);
  return Boolean(secret && hasPassword);
}

/** When true, mutating routes require a valid session cookie. */
export function writesRequireAuth(): boolean {
  return isAuthConfigured() && !authDisabled();
}

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export function getSessionCookieFromHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const prefix = `${SESSION_COOKIE}=`;
  for (const part of cookieHeader.split(';')) {
    const p = part.trim();
    if (p.startsWith(prefix)) {
      return p.slice(prefix.length);
    }
  }
  return null;
}

export async function signSessionToken(): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISS)
    .setAudience(AUD)
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecretKey(), {
      issuer: ISS,
      audience: AUD,
    });
    return true;
  } catch {
    return false;
  }
}

export async function verifyRequestSession(req: Request): Promise<boolean> {
  if (!writesRequireAuth()) return true;
  const raw = getSessionCookieFromHeader(req.headers.get('cookie'));
  if (!raw) return false;
  return verifySessionToken(raw);
}

export async function isCookieAuthenticated(
  cookieStore: SessionCookieStore
): Promise<boolean> {
  if (!writesRequireAuth()) return true;
  const t = cookieStore.get(SESSION_COOKIE)?.value;
  if (!t) return false;
  return verifySessionToken(t);
}

/**
 * Prevent open redirects: only same-origin relative paths.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = '/'): string {
  if (next == null || next === '') return fallback;
  const t = next.trim();
  if (!t.startsWith('/') || t.startsWith('//') || t.includes(':\\')) {
    return fallback;
  }
  return t;
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length, 1);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}
