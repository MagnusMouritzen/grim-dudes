import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeRedis } from '../__tests__/fakeRedis';

vi.mock('@/lib/redis', () => ({
  getJSON: async <T>(key: string): Promise<T | null> => {
    const raw = await fakeRedis.get<string>(key);
    if (raw == null || raw === '') return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setJSON: async <T>(key: string, value: T) => {
    await fakeRedis.set(key, JSON.stringify(value));
  },
}));

beforeEach(() => {
  fakeRedis.reset();
});
afterEach(() => {
  fakeRedis.reset();
});

describe('createSharePack', () => {
  it('returns base36 id with expected shape', async () => {
    const { createSharePack } = await import('./sharePacks');
    const id = await createSharePack(['alpha-npc', 'bravo-beast']);
    expect(id).toMatch(/^[0-9a-z]{1,10}$/);
    expect(id.length).toBeGreaterThanOrEqual(8);
  });

  it('produces different ids on successive calls', async () => {
    const { createSharePack } = await import('./sharePacks');
    const a = await createSharePack(['a']);
    const b = await createSharePack(['b']);
    expect(a).not.toBe(b);
  });
});
