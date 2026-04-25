import { describe, it, expect } from 'vitest';
import {
  rollD100,
  rollD10,
  rollNd10,
  d100TensOnes,
  rollD6,
  rollNd6,
  resolveOpposedD100,
  simpleTestVsTarget,
} from './wfrpRoll';

describe('rollD100', () => {
  it('returns 1–100', () => {
    for (let i = 0; i < 200; i++) {
      const r = rollD100();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(100);
    }
  });
});

describe('d100TensOnes', () => {
  it('splits 1–99 and 100 for table-style digits', () => {
    expect(d100TensOnes(1)).toEqual({ tens: 0, ones: 1 });
    expect(d100TensOnes(10)).toEqual({ tens: 1, ones: 0 });
    expect(d100TensOnes(45)).toEqual({ tens: 4, ones: 5 });
    expect(d100TensOnes(99)).toEqual({ tens: 9, ones: 9 });
    expect(d100TensOnes(100)).toEqual({ tens: 0, ones: 0 });
  });
});

describe('rollD10', () => {
  it('returns 1–10', () => {
    for (let i = 0; i < 200; i++) {
      const r = rollD10();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(10);
    }
  });
});

describe('rollNd10', () => {
  it('returns n rolls in range and subtotal = sum', () => {
    for (const n of [1, 3, 5]) {
      for (let i = 0; i < 20; i++) {
        const { rolls, subtotal } = rollNd10(n);
        expect(rolls).toHaveLength(n);
        expect(rolls.reduce((a, b) => a + b, 0)).toBe(subtotal);
        for (const d of rolls) {
          expect(d).toBeGreaterThanOrEqual(1);
          expect(d).toBeLessThanOrEqual(10);
        }
      }
    }
  });
  it('clamps count to 1–20', () => {
    const a = rollNd10(0);
    expect(a.rolls).toHaveLength(1);
    const b = rollNd10(99);
    expect(b.rolls).toHaveLength(20);
  });
});

describe('rollD6', () => {
  it('returns 1–6', () => {
    for (let i = 0; i < 200; i++) {
      const r = rollD6();
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(6);
    }
  });
});

describe('rollNd6', () => {
  it('returns n rolls in range and subtotal = sum', () => {
    for (const n of [1, 4]) {
      for (let i = 0; i < 20; i++) {
        const { rolls, subtotal } = rollNd6(n);
        expect(rolls).toHaveLength(n);
        expect(rolls.reduce((a, b) => a + b, 0)).toBe(subtotal);
        for (const d of rolls) {
          expect(d).toBeGreaterThanOrEqual(1);
          expect(d).toBeLessThanOrEqual(6);
        }
      }
    }
  });
  it('clamps count to 1–20', () => {
    expect(rollNd6(0).rolls).toHaveLength(1);
    expect(rollNd6(99).rolls).toHaveLength(20);
  });
});

describe('simpleTestVsTarget', () => {
  it('succeeds when roll <= target', () => {
    expect(simpleTestVsTarget(45, 50).success).toBe(true);
    expect(simpleTestVsTarget(50, 50).success).toBe(true);
  });
  it('fails when roll > target', () => {
    expect(simpleTestVsTarget(51, 50).success).toBe(false);
  });
});

describe('resolveOpposedD100', () => {
  it('with no targets explains optional use', () => {
    const r = resolveOpposedD100(10, 90, null, null);
    expect(r.summary).toMatch(/Optional targets/);
    expect(r.a).toBeNull();
    expect(r.b).toBeNull();
  });
  it('when only A passes, A leads', () => {
    const r = resolveOpposedD100(30, 80, 50, 50);
    expect(r.a?.success).toBe(true);
    expect(r.b?.success).toBe(false);
    expect(r.summary).toMatch(/only A passes/);
  });
  it('when both pass, points to SL in book', () => {
    const r = resolveOpposedD100(20, 25, 50, 50);
    expect(r.summary).toMatch(/Success Levels/);
  });
  it('when both fail, points to book', () => {
    const r = resolveOpposedD100(80, 85, 50, 50);
    expect(r.summary).toMatch(/Both fail/);
  });
});
