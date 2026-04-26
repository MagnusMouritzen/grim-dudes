import { describe, expect, it } from 'vitest';
import { humanoidHitLocation, WFRP4_HUMANOID_HIT_ZONES } from './wfrpHitLocation';

describe('humanoidHitLocation', () => {
  it('covers 1–100 without gaps (zones partition)', () => {
    for (let n = 1; n <= 100; n += 1) {
      expect(humanoidHitLocation(n).roll).toBe(n);
    }
    const totalSpan = WFRP4_HUMANOID_HIT_ZONES.reduce((a, z) => a + (z.max - z.min + 1), 0);
    expect(totalSpan).toBe(100);
    expect(humanoidHitLocation(1).label).toBe('Head');
    expect(humanoidHitLocation(9).label).toBe('Head');
    expect(humanoidHitLocation(10).label).toBe('Right arm');
    expect(humanoidHitLocation(44).label).toBe('Body');
    expect(humanoidHitLocation(100).label).toBe('Head');
  });

  it('clamps out-of-range input', () => {
    expect(humanoidHitLocation(0).roll).toBe(1);
    expect(humanoidHitLocation(150).roll).toBe(100);
  });
});
