/**
 * WFRP 4e Imperial coin math (1 GC = 20 silver shillings, 1 ss = 12 brass pennies).
 * Values only — not rules text.
 */

export const BRASS_PER_SHILLING = 12;
export const SHILLINGS_PER_GOLD = 20;
export const BRASS_PER_GOLD = BRASS_PER_SHILLING * SHILLINGS_PER_GOLD;

function clampInt(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function partsToBrass(
  gold: number,
  silver: number,
  brass: number
): number {
  return (
    clampInt(gold) * BRASS_PER_GOLD +
    clampInt(silver) * BRASS_PER_SHILLING +
    clampInt(brass)
  );
}

export function brassToParts(totalBrass: number): {
  gold: number;
  silver: number;
  brass: number;
} {
  let t = clampInt(totalBrass);
  const gold = Math.floor(t / BRASS_PER_GOLD);
  t %= BRASS_PER_GOLD;
  const silver = Math.floor(t / BRASS_PER_SHILLING);
  t %= BRASS_PER_SHILLING;
  return { gold, silver, brass: t };
}

export function normalizeCoinParts(
  gold: number,
  silver: number,
  brass: number
): { gold: number; silver: number; brass: number } {
  return brassToParts(partsToBrass(gold, silver, brass));
}

export function formatWfrpCoinLine(parts: {
  gold: number;
  silver: number;
  brass: number;
}): string {
  const g = parts.gold;
  const s = parts.silver;
  const b = parts.brass;
  const bits: string[] = [];
  if (g) bits.push(`${g} GC`);
  if (s) bits.push(`${s} ss`);
  if (b) bits.push(`${b} bp`);
  if (bits.length === 0) return '0 bp';
  return bits.join(', ');
}

/**
 * Split total brass into N equal integer shares. Remainder is leftover bp to assign (one each to
 * the first R recipients, a single heap, or story purposes).
 */
export function splitBrassEqually(
  totalBrass: number,
  shares: number
): { each: { gold: number; silver: number; brass: number }; remainderBrass: number; shares: number } {
  const n = Math.max(1, clampInt(shares));
  const t = clampInt(totalBrass);
  const eachBrass = Math.floor(t / n);
  const remainderBrass = t % n;
  return { each: brassToParts(eachBrass), remainderBrass, shares: n };
}

export function formatWfrpSplitLine(
  split: ReturnType<typeof splitBrassEqually>
): string {
  const eachS = formatWfrpCoinLine(split.each);
  if (split.shares <= 1) {
    return split.remainderBrass
      ? `${eachS} (+ ${split.remainderBrass} bp unassigned after equal split)`
      : eachS;
  }
  if (split.remainderBrass <= 0) {
    return `Each: ${eachS} × ${split.shares}`;
  }
  const r = split.remainderBrass;
  const n = split.shares;
  const remHint =
    r <= n
      ? `e.g. 1 bp to each of the first ${r} of ${n}, or one heap for the group`
      : `${r} bp left over is awkward to split evenly—treat as a side pot, favour, or further division`;
  return `Each: ${eachS} × ${n}; ${r} bp remainder (${remHint})`;
}
