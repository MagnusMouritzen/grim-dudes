import { describe, expect, it } from 'vitest';
import { formatNd6LogLine, formatNd10LogLine } from './poolRollLogLine';

describe('poolRollLogLine', () => {
  it('formats Nd6 with optional mod', () => {
    expect(formatNd6LogLine([2, 3, 2], 7, 0, 7)).toBe('Nd6: 7 — 2 3 2');
    expect(formatNd6LogLine([1, 1], 2, 3, 5)).toBe('Nd6: 5 — 1 1, mod +3');
    expect(formatNd6LogLine([4], 4, -1, 3)).toBe('Nd6: 3 — 4, mod -1');
  });

  it('formats Nd10', () => {
    expect(formatNd10LogLine([3, 3, 3], 9, 0, 9)).toBe('Nd10: 9 — 3 3 3');
  });
});
