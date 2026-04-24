import { describe, it, expect } from 'vitest';
import { characteristicBonus, woundsFromSize, weaponRangeYards } from './statblockUtils';

describe('statblockUtils', () => {
  it('characteristicBonus divides by ten and floors', () => {
    expect(characteristicBonus(39)).toBe(3);
    expect(characteristicBonus(40)).toBe(4);
    expect(characteristicBonus('')).toBe(0);
  });

  it('woundsFromSize Average uses TB WPB SB', () => {
    const get = (k: 'T' | 'WP' | 'S') => ({ T: 40, WP: 30, S: 30 }[k] ?? 0);
    expect(woundsFromSize('Average', get)).toBe(2 * 4 + 3 + 3);
  });

  it('weaponRangeYards uses SB multiplier when set', () => {
    expect(weaponRangeYards({ rangeSbMultiplier: 2 }, 4)).toBe(8);
    expect(weaponRangeYards({ range: 24 }, 4)).toBe(24);
  });
});
