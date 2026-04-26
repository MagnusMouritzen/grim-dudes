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
  wfrp4SuccessLevel,
  wfrpRollTensColumn,
  wfrpTargetTensColumn,
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
  it('treats 100 as automatic failure (WFRP 4e standard test)', () => {
    expect(simpleTestVsTarget(100, 100).success).toBe(false);
    expect(simpleTestVsTarget(100, 99).success).toBe(false);
  });
});

describe('wfrpTargetTensColumn / wfrpRollTensColumn', () => {
  it('maps target 1–100 to the 10s column for SL', () => {
    expect(wfrpTargetTensColumn(1)).toBe(0);
    expect(wfrpTargetTensColumn(45)).toBe(4);
    expect(wfrpTargetTensColumn(100)).toBe(10);
  });
  it('maps roll 100 to 0 when not failed, 10 on failure (fumble)', () => {
    expect(wfrpRollTensColumn(100, false)).toBe(0);
    expect(wfrpRollTensColumn(100, true)).toBe(10);
    expect(wfrpRollTensColumn(5, true)).toBe(0);
    expect(wfrpRollTensColumn(50, true)).toBe(5);
  });
});

describe('wfrp4SuccessLevel', () => {
  it('matches core SL: target 55, roll 35 → +2', () => {
    expect(wfrp4SuccessLevel(35, 55)).toEqual({ roll: 35, target: 55, success: true, sl: 2 });
  });
  it('fails 100 with strongly negative SL vs TN 50', () => {
    const r = wfrp4SuccessLevel(100, 50);
    expect(r.success).toBe(false);
    expect(r.sl).toBe(-5);
  });
  it('fails 65 vs 50 with SL -1', () => {
    const r = wfrp4SuccessLevel(65, 50);
    expect(r.success).toBe(false);
    expect(r.sl).toBe(-1);
  });
  it('01 vs 30 succeeds with +3', () => {
    expect(wfrp4SuccessLevel(1, 30)).toEqual({ roll: 1, target: 30, success: true, sl: 3 });
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
  it('when both pass, includes both SLs and a quick comparison', () => {
    const r = resolveOpposedD100(10, 30, 50, 50);
    expect(r.summary).toMatch(/Both pass/);
    expect(r.summary).toMatch(/A SL \+4/);
    expect(r.summary).toMatch(/B SL \+2/);
    expect(r.summary).toMatch(/A is ahead/);
  });
  it('when both fail, points to book', () => {
    const r = resolveOpposedD100(80, 85, 50, 50);
    expect(r.summary).toMatch(/Both fail/);
  });
});
