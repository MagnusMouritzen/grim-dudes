import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeRedis } from './fakeRedis';
import { PROD_WRITE_AUTH_MISCONFIG_MESSAGE, SESSION_COOKIE } from '@/lib/session';

vi.mock('@/lib/redis', () => ({
  getRedis: () => fakeRedis,
  getJSON: async <T>(key: string): Promise<T | null> => {
    const raw = await fakeRedis.get<string>(key);
    if (raw == null || raw === '') return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  mgetJSON: async <T>(keys: string[]): Promise<(T | null)[]> => {
    if (keys.length === 0) return [];
    const values = await fakeRedis.mget(...keys);
    return values.map((raw) => {
      if (raw == null || raw === '') return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    });
  },
  setJSON: async <T>(
    key: string,
    value: T,
    options?: { ex?: number }
  ): Promise<void> => {
    await fakeRedis.set(key, JSON.stringify(value));
    void options;
  },
}));

// Disable rate limiting in the tests by pretending Upstash env is missing.
const origUrl = process.env.UPSTASH_REDIS_REST_URL;
const origTok = process.env.UPSTASH_REDIS_REST_TOKEN;
const origAuthSecret = process.env.AUTH_SECRET;
const origAuthPassword = process.env.AUTH_PASSWORD;
const origAuthHash = process.env.AUTH_PASSWORD_HASH;
const origAuthDisabled = process.env.AUTH_DISABLED;
const origVercelEnv = process.env.VERCEL_ENV;
const origAllowUnauth = process.env.ALLOW_UNAUTHENTICATED_WRITES;

beforeEach(() => {
  fakeRedis.reset();
  // Force the rate limiter to no-op by hiding upstash env.
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.AUTH_SECRET;
  delete process.env.AUTH_PASSWORD;
  delete process.env.AUTH_PASSWORD_HASH;
  delete process.env.AUTH_DISABLED;
  delete process.env.VERCEL_ENV;
  delete process.env.ALLOW_UNAUTHENTICATED_WRITES;
});

afterEach(() => {
  if (origUrl == null) delete process.env.UPSTASH_REDIS_REST_URL;
  else process.env.UPSTASH_REDIS_REST_URL = origUrl;
  if (origTok == null) delete process.env.UPSTASH_REDIS_REST_TOKEN;
  else process.env.UPSTASH_REDIS_REST_TOKEN = origTok;
  if (origAuthSecret == null) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = origAuthSecret;
  if (origAuthPassword == null) delete process.env.AUTH_PASSWORD;
  else process.env.AUTH_PASSWORD = origAuthPassword;
  if (origAuthHash == null) delete process.env.AUTH_PASSWORD_HASH;
  else process.env.AUTH_PASSWORD_HASH = origAuthHash;
  if (origAuthDisabled == null) delete process.env.AUTH_DISABLED;
  else process.env.AUTH_DISABLED = origAuthDisabled;
  if (origVercelEnv == null) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = origVercelEnv;
  if (origAllowUnauth == null) delete process.env.ALLOW_UNAUTHENTICATED_WRITES;
  else process.env.ALLOW_UNAUTHENTICATED_WRITES = origAllowUnauth;
});

async function POSTstatblocks(body: unknown, headers: Record<string, string> = {}) {
  const { POST } = await import('../../app/api/statblocks/route');
  return POST(
    new Request('http://localhost/api/statblocks', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
  );
}

async function GETstatblocks(query = '') {
  const { GET } = await import('../../app/api/statblocks/route');
  return GET(new Request(`http://localhost/api/statblocks${query}`));
}

async function GETstatblockById(id: string) {
  const { GET } = await import('../../app/api/statblocks/[id]/route');
  return GET(new Request(`http://localhost/api/statblocks/${encodeURIComponent(id)}`), {
    params: Promise.resolve({ id }),
  });
}

async function DELETEstatblockById(id: string, headers: Record<string, string> = {}) {
  const { DELETE } = await import('../../app/api/statblocks/[id]/route');
  return DELETE(
    new Request(`http://localhost/api/statblocks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    }),
    { params: Promise.resolve({ id }) }
  );
}

describe('POST /api/statblocks', () => {
  it('creates a stat block and returns 201', async () => {
    const res = await POSTstatblocks({ name: 'Dog' });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe('dog');
    expect(body.name).toBe('Dog');
  });

  it('slugifies the id from name when id missing', async () => {
    const res = await POSTstatblocks({ name: 'Captain Pfeffer' });
    const body = await res.json();
    expect(body.id).toBe('captain-pfeffer');
  });

  it('400s invalid JSON/shape', async () => {
    const res = await POSTstatblocks({ characteristics: { WS: 'nope' } });
    expect(res.status).toBe(400);
  });

  it('requires session when auth is configured', async () => {
    process.env.AUTH_SECRET = 'secret-secret-secret-secret-secret';
    process.env.AUTH_PASSWORD = 'testpass';
    const bad = await POSTstatblocks({ name: 'X' });
    expect(bad.status).toBe(401);
    const { signSessionToken } = await import('@/lib/session');
    const token = await signSessionToken();
    const ok = await POSTstatblocks(
      { name: 'X' },
      { cookie: `${SESSION_COOKIE}=${token}` }
    );
    expect(ok.status).toBe(201);
  });

  it('returns 503 when production has Upstash but auth is not configured', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'x';
    const res = await POSTstatblocks({ name: 'X' });
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(PROD_WRITE_AUTH_MISCONFIG_MESSAGE);
  });
});

describe('GET /api/statblocks', () => {
  it('returns an array', async () => {
    await POSTstatblocks({ name: 'Dog' });
    await POSTstatblocks({ name: 'Cat' });
    const res = await GETstatblocks();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it('paginates with ?cursor/?limit', async () => {
    await POSTstatblocks({ name: 'Dog' });
    const res = await GETstatblocks('?cursor=0&limit=10');
    const body = await res.json();
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('nextCursor');
  });
});

describe('GET / DELETE /api/statblocks/[id]', () => {
  it('GETs by id, 404 on miss', async () => {
    await POSTstatblocks({ name: 'Dog' });
    const ok = await GETstatblockById('dog');
    expect(ok.status).toBe(200);
    const miss = await GETstatblockById('nope');
    expect(miss.status).toBe(404);
  });

  it('DELETE requires session when auth is configured', async () => {
    await POSTstatblocks({ name: 'Dog' });
    process.env.AUTH_SECRET = 'secret-secret-secret-secret-secret';
    process.env.AUTH_PASSWORD = 'testpass';
    const bad = await DELETEstatblockById('dog');
    expect(bad.status).toBe(401);
    const { signSessionToken } = await import('@/lib/session');
    const token = await signSessionToken();
    const ok = await DELETEstatblockById('dog', { cookie: `${SESSION_COOKIE}=${token}` });
    expect(ok.status).toBe(204);
    const miss = await GETstatblockById('dog');
    expect(miss.status).toBe(404);
  });
});
