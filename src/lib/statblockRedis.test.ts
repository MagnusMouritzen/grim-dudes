import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeRedis } from '@/__tests__/fakeRedis';

vi.mock('./redis', () => ({
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

async function freshModule() {
  const mod = await import('./statblockRedis');
  return mod;
}

beforeEach(() => {
  fakeRedis.reset();
  delete process.env.REDIS_KEY_PREFIX;
});

describe('statblockRedis', () => {
  it('saves and retrieves a stat block atomically (index + value)', async () => {
    const { saveStatblock, getStatblockById, listStatblocks } = await freshModule();
    await saveStatblock({ id: 'dog', name: 'Dog' });
    const got = await getStatblockById('dog');
    expect(got?.name).toBe('Dog');
    const list = await listStatblocks();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe('dog');
  });

  it('listStatblocks sorts by name then id', async () => {
    const { saveStatblock, listStatblocks } = await freshModule();
    await saveStatblock({ id: 'b', name: 'Zog' });
    await saveStatblock({ id: 'a', name: 'Alphonse' });
    await saveStatblock({ id: 'c', name: 'Alphonse' });
    const list = await listStatblocks();
    expect(list.map((b) => b.id)).toEqual(['a', 'c', 'b']);
  });

  it('listStatblocks does NOT mutate the index on missing values', async () => {
    const { saveStatblock, listStatblocks } = await freshModule();
    await saveStatblock({ id: 'dog', name: 'Dog' });
    // Simulate a partial failure: index has a phantom entry with no backing value.
    await fakeRedis.sadd('statblock:index', 'ghost');
    const before = Array.from(fakeRedis.sets.get('statblock:index') ?? []);
    const list = await listStatblocks();
    expect(list.map((b) => b.id)).toEqual(['dog']);
    const after = Array.from(fakeRedis.sets.get('statblock:index') ?? []);
    expect(after).toEqual(before); // untouched
  });

  it('deleteStatblock removes key and index membership', async () => {
    const { saveStatblock, deleteStatblock, getStatblockById } = await freshModule();
    await saveStatblock({ id: 'dog', name: 'Dog' });
    expect(await deleteStatblock('dog')).toBe(true);
    expect(await getStatblockById('dog')).toBeNull();
    const members = await fakeRedis.smembers('statblock:index');
    expect(members).not.toContain('dog');
  });

  it('deleteStatblock returns false when key is absent', async () => {
    const { deleteStatblock } = await freshModule();
    expect(await deleteStatblock('nope')).toBe(false);
  });

  it('cleanupOrphans removes phantom index entries', async () => {
    const { saveStatblock, cleanupOrphans } = await freshModule();
    await saveStatblock({ id: 'dog', name: 'Dog' });
    await fakeRedis.sadd('statblock:index', 'ghost');
    const res = await cleanupOrphans();
    expect(res.removed).toEqual(['ghost']);
    expect(res.kept).toBe(1);
  });

  it('listStatblocksPage returns a single page via sscan', async () => {
    const { saveStatblock, listStatblocksPage } = await freshModule();
    await saveStatblock({ id: 'dog', name: 'Dog' });
    await saveStatblock({ id: 'cat', name: 'Cat' });
    const page = await listStatblocksPage(0, 10);
    expect(page.blocks.map((b) => b.id).sort()).toEqual(['cat', 'dog']);
    expect(page.nextCursor).toBe('0');
  });

  it('respects REDIS_KEY_PREFIX', async () => {
    process.env.REDIS_KEY_PREFIX = 'preview:';
    const { saveStatblock } = await freshModule();
    await saveStatblock({ id: 'dog', name: 'Dog' });
    expect(fakeRedis.kv.has('preview:statblock:dog')).toBe(true);
    expect(fakeRedis.sets.get('preview:statblock:index')?.has('dog')).toBe(true);
  });
});
