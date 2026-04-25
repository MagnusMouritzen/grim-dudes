import { describe, expect, it } from 'vitest';
import {
  BRASS_PER_GOLD,
  brassToParts,
  formatWfrpCoinLine,
  formatWfrpSplitLine,
  normalizeCoinParts,
  partsToBrass,
  splitBrassEqually,
} from './wfrpCurrency';

describe('wfrpCurrency', () => {
  it('converts 1 GC to 240 brass', () => {
    expect(partsToBrass(1, 0, 0)).toBe(240);
  });

  it('normalizes 25 ss to 1 GC 5 ss', () => {
    expect(normalizeCoinParts(0, 25, 0)).toEqual({ gold: 1, silver: 5, brass: 0 });
  });

  it('normalizes 13 brass to 1 ss 1 bp', () => {
    expect(normalizeCoinParts(0, 0, 13)).toEqual({ gold: 0, silver: 1, brass: 1 });
  });

  it('clamps negative to zero in parts', () => {
    expect(partsToBrass(-1, 5, 0)).toBe(5 * 12);
  });

  it('formats empty as 0 bp', () => {
    expect(formatWfrpCoinLine({ gold: 0, silver: 0, brass: 0 })).toBe('0 bp');
  });

  it('brassToParts round-trips with partsToBrass', () => {
    const t = 999;
    const p = brassToParts(t);
    expect(partsToBrass(p.gold, p.silver, p.brass)).toBe(t);
  });

  it('handles large totals', () => {
    const p = brassToParts(BRASS_PER_GOLD * 3 + 5);
    expect(p).toEqual({ gold: 3, silver: 0, brass: 5 });
  });

  it('splits 100 bp among 3 with remainder 1', () => {
    const s = splitBrassEqually(100, 3);
    expect(s.shares).toBe(3);
    expect(partsToBrass(s.each.gold, s.each.silver, s.each.brass)).toBe(33);
    expect(s.each).toEqual({ gold: 0, silver: 2, brass: 9 });
    expect(s.remainderBrass).toBe(1);
  });

  it('formatWfrpSplitLine mentions share count', () => {
    const s = splitBrassEqually(13, 4);
    expect(formatWfrpSplitLine(s)).toMatch(/Each:/);
    expect(formatWfrpSplitLine(s)).toMatch(/× 4/);
  });

  it('formatWfrpSplitLine when remainder exceeds shares suggests side pot', () => {
    const s = splitBrassEqually(10, 3);
    expect(s.remainderBrass).toBe(1);
    expect(formatWfrpSplitLine(s)).toMatch(/remainder/);
  });
});
