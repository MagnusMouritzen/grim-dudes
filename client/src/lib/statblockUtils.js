/**
 * Characteristic bonus: characteristic ÷ 10, rounded down.
 * Used for wounds formula and trait effects (e.g. Hardy: +TB wounds).
 */
export function characteristicBonus(characteristicValue) {
  const n = Number(characteristicValue);
  if (!Number.isFinite(n)) return 0;
  return Math.floor(n / 10);
}

export const SIZES = [
  'Tiny',
  'Little',
  'Small',
  'Average',
  'Large',
  'Enormous',
  'Monstrous',
];

const DEFAULT_SIZE = 'Average';

/**
 * Compute wounds from size and characteristic bonuses.
 * getChar(key) should return the effective characteristic value (number) for WS, BS, S, T, I, Ag, Dex, Int, WP, Fel.
 */
export function woundsFromSize(size, getChar) {
  const s = size || DEFAULT_SIZE;
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
      return 2 * TB + WPB + SB; // treat unknown as Average
  }
}

export { DEFAULT_SIZE };
