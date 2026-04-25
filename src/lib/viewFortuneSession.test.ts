/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest';
import { loadFortune, nudgeFortune, saveFortune } from './viewFortuneSession';

const key = 't-fortune';

describe('viewFortuneSession', () => {
  afterEach(() => {
    sessionStorage.removeItem(`grim-dudes:fortune:${key}`);
  });

  it('nudges within 0–99', () => {
    saveFortune(key, 2);
    expect(nudgeFortune(key, 1)).toBe(3);
    expect(nudgeFortune(key, -1)).toBe(2);
  });

  it('clamps to 0 and 99', () => {
    saveFortune(key, 0);
    expect(nudgeFortune(key, -1)).toBe(0);
    saveFortune(key, 99);
    expect(nudgeFortune(key, 1)).toBe(99);
  });

  it('round-trips', () => {
    saveFortune(key, 12);
    expect(loadFortune(key)).toBe(12);
  });
});
