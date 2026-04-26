import { describe, it, expect } from 'vitest';
import { parseFavoriteIdsJson, serializeFavoriteIds } from './bestiaryFavorites';

describe('bestiaryFavorites', () => {
  it('round-trips id sets via JSON', () => {
    const s = new Set(['z', 'a', 'a']);
    const json = serializeFavoriteIds(s);
    expect(json).toBe('["a","z"]');
    const back = parseFavoriteIdsJson(json);
    expect(back.has('a')).toBe(true);
    expect(back.has('z')).toBe(true);
    expect(back.size).toBe(2);
  });

  it('handles empty and invalid', () => {
    expect(parseFavoriteIdsJson(null).size).toBe(0);
    expect(parseFavoriteIdsJson('[]').size).toBe(0);
    expect(parseFavoriteIdsJson('not-json').size).toBe(0);
  });
});
