import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { requireWriteAuth, writeAuthRequired } from './writeAuth';
import { SESSION_COOKIE, signSessionToken } from './session';

const origSecret = process.env.AUTH_SECRET;
const origPwd = process.env.AUTH_PASSWORD;
const origHash = process.env.AUTH_PASSWORD_HASH;
const origDisabled = process.env.AUTH_DISABLED;

beforeEach(() => {
  delete process.env.AUTH_SECRET;
  delete process.env.AUTH_PASSWORD;
  delete process.env.AUTH_PASSWORD_HASH;
  delete process.env.AUTH_DISABLED;
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
});
