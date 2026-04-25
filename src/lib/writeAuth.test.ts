import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { requireWriteAuth, writeAuthRequired } from './writeAuth';
import {
  PROD_WRITE_AUTH_MISCONFIG_MESSAGE,
  SESSION_COOKIE,
  signSessionToken,
} from './session';

const origSecret = process.env.AUTH_SECRET;
const origPwd = process.env.AUTH_PASSWORD;
const origHash = process.env.AUTH_PASSWORD_HASH;
const origDisabled = process.env.AUTH_DISABLED;
const origVercelEnv = process.env.VERCEL_ENV;
const origNodeEnv = process.env.NODE_ENV;
const origUpUrl = process.env.UPSTASH_REDIS_REST_URL;
const origUpTok = process.env.UPSTASH_REDIS_REST_TOKEN;
const origAllowUnauth = process.env.ALLOW_UNAUTHENTICATED_WRITES;

beforeEach(() => {
  delete process.env.AUTH_SECRET;
  delete process.env.AUTH_PASSWORD;
  delete process.env.AUTH_PASSWORD_HASH;
  delete process.env.AUTH_DISABLED;
  delete process.env.VERCEL_ENV;
  delete process.env.ALLOW_UNAUTHENTICATED_WRITES;
  if (origUpUrl == null) delete process.env.UPSTASH_REDIS_REST_URL;
  else process.env.UPSTASH_REDIS_REST_URL = origUpUrl;
  if (origUpTok == null) delete process.env.UPSTASH_REDIS_REST_TOKEN;
  else process.env.UPSTASH_REDIS_REST_TOKEN = origUpTok;
  if (origNodeEnv != null) {
    // Tests restore env; @types/node marks NODE_ENV as read-only.
    (process.env as { NODE_ENV?: string }).NODE_ENV = origNodeEnv;
  }
});

afterEach(() => {
  if (origSecret == null) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = origSecret;
  if (origPwd == null) delete process.env.AUTH_PASSWORD;
  else process.env.AUTH_PASSWORD = origPwd;
  if (origHash == null) delete process.env.AUTH_PASSWORD_HASH;
  else process.env.AUTH_PASSWORD_HASH = origHash;
  if (origDisabled == null) delete process.env.AUTH_DISABLED;
  else process.env.AUTH_DISABLED = origDisabled;
  if (origVercelEnv == null) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = origVercelEnv;
  if (origNodeEnv == null) {
    delete (process.env as { NODE_ENV?: string }).NODE_ENV;
  } else {
    (process.env as { NODE_ENV?: string }).NODE_ENV = origNodeEnv;
  }
  if (origUpUrl == null) delete process.env.UPSTASH_REDIS_REST_URL;
  else process.env.UPSTASH_REDIS_REST_URL = origUpUrl;
  if (origUpTok == null) delete process.env.UPSTASH_REDIS_REST_TOKEN;
  else process.env.UPSTASH_REDIS_REST_TOKEN = origUpTok;
  if (origAllowUnauth == null) delete process.env.ALLOW_UNAUTHENTICATED_WRITES;
  else process.env.ALLOW_UNAUTHENTICATED_WRITES = origAllowUnauth;
});

function req(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/statblocks', {
    method: 'POST',
    headers,
  });
}

describe('requireWriteAuth', () => {
  it('allows when auth is not configured (open writes)', async () => {
    expect(writeAuthRequired()).toBe(false);
    expect(await requireWriteAuth(req())).toBeNull();
  });

  it('allows when AUTH_DISABLED is set', async () => {
    process.env.AUTH_SECRET = 'secret-secret-secret-secret-secret';
    process.env.AUTH_PASSWORD = 'x';
    process.env.AUTH_DISABLED = '1';
    expect(writeAuthRequired()).toBe(false);
    expect(await requireWriteAuth(req())).toBeNull();
  });

  it('rejects when session required and cookie missing', async () => {
    process.env.AUTH_SECRET = 'secret-secret-secret-secret-secret';
    process.env.AUTH_PASSWORD = 'x';
    const res = await requireWriteAuth(req());
    expect(res).not.toBeNull();
    expect(res?.status).toBe(401);
    expect(writeAuthRequired()).toBe(true);
  });

  it('accepts grim_session cookie with valid JWT', async () => {
    process.env.AUTH_SECRET = 'secret-secret-secret-secret-secret';
    process.env.AUTH_PASSWORD = 'x';
    const token = await signSessionToken();
    expect(
      await requireWriteAuth(req({ cookie: `foo=bar; ${SESSION_COOKIE}=${token}; baz=qux` }))
    ).toBeNull();
  });

  it('rejects invalid session token', async () => {
    process.env.AUTH_SECRET = 'secret-secret-secret-secret-secret';
    process.env.AUTH_PASSWORD = 'x';
    const res = await requireWriteAuth(
      req({ cookie: `${SESSION_COOKIE}=not-a-valid-jwt` })
    );
    expect(res?.status).toBe(401);
  });

  it('returns 503 when production has Upstash but session auth is not configured', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    const res = await requireWriteAuth(req());
    expect(res?.status).toBe(503);
    const j = (await res?.json()) as { error?: string };
    expect(j.error).toBe(PROD_WRITE_AUTH_MISCONFIG_MESSAGE);
  });

  it('allows open writes in production+Upstash when ALLOW_UNAUTHENTICATED_WRITES=1', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    process.env.ALLOW_UNAUTHENTICATED_WRITES = '1';
    expect(await requireWriteAuth(req())).toBeNull();
  });
});
