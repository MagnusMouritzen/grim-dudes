/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  mergeD100History,
  D100_HISTORY_MAX,
  type D100HistoryEntry,
  loadD100History,
} from './viewD100History';

describe('mergeD100History', () => {
  it('prepends and caps length', () => {
    const base: D100HistoryEntry[] = Array.from({ length: D100_HISTORY_MAX }, (_, i) => ({
      roll: i + 1,
    }));
    const next = mergeD100History(base, 99);
    expect(next[0]).toEqual({ roll: 99 });
    expect(next).toHaveLength(D100_HISTORY_MAX);
  });

  it('includes optional tag on new entry', () => {
    const next = mergeD100History([], 42, 'Perception');
    expect(next[0]).toEqual({ roll: 42, tag: 'Perception' });
  });
});

describe('loadD100History legacy', () => {
  beforeEach(() => {
    sessionStorage.removeItem('grim-dudes:d100-history:leg');
  });

  it('migrates plain number array from session JSON', () => {
    sessionStorage.setItem('grim-dudes:d100-history:leg', JSON.stringify([7, 8, 9]));
    const h = loadD100History('leg');
    expect(h).toEqual([{ roll: 7 }, { roll: 8 }, { roll: 9 }]);
  });
});
