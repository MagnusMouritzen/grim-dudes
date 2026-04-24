import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeRedis } from './fakeRedis';

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
const origWrite = process.env.WRITE_TOKEN;

beforeEach(() => {
  fakeRedis.reset();
  // Force the rate limiter to no-op by hiding upstash env.
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

afterEach(() => {
  if (origUrl == null) delete process.env.UPSTASH_REDIS_REST_URL;
  else process.env.UPSTASH_REDIS_REST_URL = origUrl;
  if (origTok == null) delete process.env.UPSTASH_REDIS_REST_TOKEN;
  else process.env.UPSTASH_REDIS_REST_TOKEN = origTok;
  if (origWrite == null) delete process.env.WRITE_TOKEN;
  else process.env.WRITE_TOKEN = origWrite;
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

  it('requires auth when WRITE_TOKEN is set', async () => {
    process.env.WRITE_TOKEN = 'secret';
    const bad = await POSTstatblocks({ name: 'X' });
    expect(bad.status).toBe(401);
    const ok = await POSTstatblocks({ name: 'X' }, { 'x-write-token': 'secret' });
    expect(ok.status).toBe(201);
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

  it('DELETE requires auth when WRITE_TOKEN is set', async () => {
    await POSTstatblocks({ name: 'Dog' });
    process.env.WRITE_TOKEN = 'secret';
    const bad = await DELETEstatblockById('dog');
    expect(bad.status).toBe(401);
    const ok = await DELETEstatblockById('dog', { 'x-write-token': 'secret' });
    expect(ok.status).toBe(204);
    const miss = await GETstatblockById('dog');
    expect(miss.status).toBe(404);
  });
});
