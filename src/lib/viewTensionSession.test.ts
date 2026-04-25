/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest';
import { loadTension, nudgeTension, saveTension } from './viewTensionSession';

const key = 't-tension';

describe('viewTensionSession', () => {
  afterEach(() => {
    sessionStorage.removeItem(`grim-dudes:tension:${key}`);
  });

  it('nudges within 0–8', () => {
    saveTension(key, 3);
    expect(nudgeTension(key, 2)).toBe(5);
    expect(nudgeTension(key, 10)).toBe(8);
  });

  it('clamps to 0', () => {
    saveTension(key, 1);
    expect(nudgeTension(key, -5)).toBe(0);
  });

  it('round-trips', () => {
    saveTension(key, 7);
    expect(loadTension(key)).toBe(7);
  });
});
