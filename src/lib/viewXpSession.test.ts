/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest';
import { loadSessionXp, nudgeSessionXp, saveSessionXp } from './viewXpSession';

const key = 't-xp';

describe('viewXpSession', () => {
  afterEach(() => {
    sessionStorage.removeItem(`grim-dudes:session-xp:${key}`);
  });

  it('nudges within 0–999', () => {
    saveSessionXp(key, 10);
    expect(nudgeSessionXp(key, 5)).toBe(15);
    expect(nudgeSessionXp(key, -20)).toBe(0);
  });

  it('clamps at 999', () => {
    saveSessionXp(key, 997);
    expect(nudgeSessionXp(key, 50)).toBe(999);
  });

  it('round-trips with loadSessionXp', () => {
    saveSessionXp(key, 42);
    expect(loadSessionXp(key)).toBe(42);
  });
});
