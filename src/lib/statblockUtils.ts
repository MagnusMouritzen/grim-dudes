import type { RangedWeaponRef, Size } from './types';

/**
 * Characteristic bonus: characteristic ÷ 10, rounded down.
 * Used for wounds formula and trait effects (e.g. Hardy: +TB wounds).
 */
export function characteristicBonus(characteristicValue: unknown): number {
  const n = Number(characteristicValue);
  if (!Number.isFinite(n)) return 0;
  return Math.floor(n / 10);
}

/**
 * Resolve ranged weapon range in yards.
 * If weapon has rangeSbMultiplier (e.g. 2 for SB×2), returns strengthBonus × multiplier.
 * Otherwise returns weapon.range (fixed yards).
 * Use this before adding any range from ammunition.
 */
export function weaponRangeYards(
  weapon: Pick<RangedWeaponRef, 'range' | 'rangeSbMultiplier'> | null | undefined,
  strengthBonus: unknown
): number {
  const sb = Number(strengthBonus);
  const mult = weapon?.rangeSbMultiplier;
  if (typeof mult === 'number' && Number.isFinite(mult) && mult >= 0) {
    return (Number.isFinite(sb) ? sb : 0) * mult;
  }
  const fixed = Number(weapon?.range);
  return Number.isFinite(fixed) ? fixed : 0;
}

export const SIZES: Size[] = [
  'Tiny',
  'Little',
  'Small',
  'Average',
  'Large',
  'Enormous',
  'Monstrous',
];

const DEFAULT_SIZE: Size = 'Average';

/**
 * Compute wounds from size and characteristic bonuses.
 * getChar(key) should return the effective characteristic value (number) for WS, BS, S, T, I, Ag, Dex, Int, WP, Fel.
 */
export function woundsFromSize(
  size: Size | string | undefined,
  getChar: (key: 'T' | 'WP' | 'S') => number
): number {
  const s = (size as Size) || DEFAULT_SIZE;
  const TB = characteristicBonus(getChar('T') ?? 0);
  const WPB = characteristicBonus(getChar('WP') ?? 0);
  const SB = characteristicBonus(getChar('S') ?? 0);

  switch (s) {
    case 'Tiny':
      return 1;
    case 'Little':
      return TB;
    case 'Small':
      return 2 * TB + WPB;
    case 'Average':
      return 2 * TB + WPB + SB;
    case 'Large':
      return (2 * TB + WPB + SB) * 2;
    case 'Enormous':
      return (2 * TB + WPB + SB) * 4;
    case 'Monstrous':
      return (2 * TB + WPB + SB) * 8;
    default:
      return 2 * TB + WPB + SB;
  }
}

export { DEFAULT_SIZE };
