/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { bumpRound, loadRound, saveRound, subscribeRound } from './viewRoundSession';

describe('viewRoundSession', () => {
  const key = 'test-view';

  afterEach(() => {
    sessionStorage.removeItem(`grim-dudes:round:${key}`);
    vi.restoreAllMocks();
  });

  it('saveRound and loadRound round-trip', () => {
    saveRound(key, 4);
    expect(loadRound(key)).toBe(4);
  });

  it('bumpRound increments stored value', () => {
    saveRound(key, 2);
    expect(bumpRound(key)).toBe(3);
    expect(loadRound(key)).toBe(3);
  });

  it('subscribeRound runs when saveRound updates from elsewhere', () => {
    const fn = vi.fn();
    const unsub = subscribeRound(key, fn);
    saveRound(key, 5);
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    saveRound(key, 6);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
