/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest';
import { loadAdvantage, nudgeAdvantage, saveAdvantage } from './viewAdvantageSession';

const key = 't-adv';

describe('viewAdvantageSession', () => {
  afterEach(() => {
    sessionStorage.removeItem(`grim-dudes:advantage:${key}`);
  });

  it('nudges 0–10', () => {
    expect(nudgeAdvantage(key, 3)).toBe(3);
    expect(nudgeAdvantage(key, 10)).toBe(10);
  });

  it('clamps', () => {
    saveAdvantage(key, 1);
    expect(nudgeAdvantage(key, -5)).toBe(0);
  });

  it('round-trips', () => {
    saveAdvantage(key, 7);
    expect(loadAdvantage(key)).toBe(7);
  });
});
