import { describe, it, expect } from 'vitest';
import { getGmConditions, searchGmConditions } from './gmConditions';

describe('gmConditions', () => {
  it('returns a non-empty list', () => {
    expect(getGmConditions().length).toBeGreaterThan(0);
  });
  it('filters by name', () => {
    const r = searchGmConditions('prone');
    expect(r.some((c) => c.id === 'prone')).toBe(true);
  });
  it('finds new entries by hint text', () => {
    const r = searchGmConditions('surprise');
    expect(r.some((c) => c.id === 'surprised')).toBe(true);
  });
});
