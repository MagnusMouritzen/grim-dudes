/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest';
import { loadCorruption, nudgeCorruption, saveCorruption } from './viewCorruptionSession';

const key = 't-corr';

describe('viewCorruptionSession', () => {
  afterEach(() => {
    sessionStorage.removeItem(`grim-dudes:corruption:${key}`);
  });

  it('nudges within 0–99', () => {
    saveCorruption(key, 2);
    expect(nudgeCorruption(key, 1)).toBe(3);
    expect(nudgeCorruption(key, -1)).toBe(2);
  });

  it('clamps to 0 and 99', () => {
    saveCorruption(key, 0);
    expect(nudgeCorruption(key, -1)).toBe(0);
    saveCorruption(key, 99);
    expect(nudgeCorruption(key, 1)).toBe(99);
  });

  it('round-trips', () => {
    saveCorruption(key, 7);
    expect(loadCorruption(key)).toBe(7);
  });
});
