/**
 * WFRP 4e uses d100 tests. This module offers a simple at-the-table helper:
 * unmodified tests where success is commonly read as "roll ≤ target" before
 * situational modifiers — GMs still apply difficulty, Advantage, etc. at the table.
 */

export function rollD100(): number {
  return 1 + Math.floor(Math.random() * 100);
}

/**
 * Split a 1–100 d100 value into the two digits used on many WFRP tables
 * (tens die / ones die; 100 as 0+0 in that convention).
 */
export function d100TensOnes(roll: number): { tens: number; ones: number } {
  const r = Math.max(1, Math.min(100, Math.floor(roll)));
  if (r === 100) return { tens: 0, ones: 0 };
  const tens = Math.floor(r / 10) % 10;
  const ones = r % 10;
  return { tens, ones };
}

/** Single d10, WFRP style (1–10, not 0–9). */
export function rollD10(): number {
  return 1 + Math.floor(Math.random() * 10);
}

const ND10_MAX = 20;

/**
 * Roll several d10s and sum (weapon damage, spell dice, etc.).
 * GMs may still apply other steps (minimum damage, crits) per the table.
 */
export function rollNd10(n: number): { rolls: number[]; subtotal: number } {
  const count = Math.max(1, Math.min(ND10_MAX, Math.floor(Number.isFinite(n) ? n : 1)));
  const rolls: number[] = [];
  let subtotal = 0;
  for (let i = 0; i < count; i += 1) {
    const d = rollD10();
    rolls.push(d);
    subtotal += d;
  }
  return { rolls, subtotal };
}

/** Standard d6 (1–6). */
export function rollD6(): number {
  return 1 + Math.floor(Math.random() * 6);
}

const ND6_MAX = 20;

/** Roll several d6 and sum (misc tables, loose house rules—use your book for official steps). */
export function rollNd6(n: number): { rolls: number[]; subtotal: number } {
  const count = Math.max(1, Math.min(ND6_MAX, Math.floor(Number.isFinite(n) ? n : 1)));
  const rolls: number[] = [];
  let subtotal = 0;
  for (let i = 0; i < count; i += 1) {
    const d = rollD6();
    rolls.push(d);
    subtotal += d;
  }
  return { rolls, subtotal };
}

export type SimpleTestResult = {
  roll: number;
  target: number;
  success: boolean;
  /** Rough margin in "tens" for display only; not a substitute for full SL rules. */
  marginTens: number;
};

/**
 * Unmodified test: success if roll ≤ target (after the GM applies final target number).
 * 01 often treated as critical success; 100 as fumble in many tables — caller can style.
 */
export function simpleTestVsTarget(roll: number, target: number): SimpleTestResult {
  const t = Math.max(0, Math.min(100, Math.floor(target)));
  const r = Math.max(1, Math.min(100, Math.floor(roll)));
  const success = r <= t;
  const marginTens = success
    ? Math.floor((t - r) / 10)
    : -Math.floor((r - t) / 10);
  return { roll: r, target: t, success, marginTens };
}

/** Two d100s for an opposed test (resolve with `resolveOpposedD100` + optional targets). */
export function rollOpposedD100(): { a: number; b: number } {
  return { a: rollD100(), b: rollD100() };
}

/**
 * When both final targets (1–100) are set: clear winner if exactly one side passes the simple
 * ≤-target test. If both pass or both fail, the book’s Success Level / double-fail steps apply—
 * this helper only surfaces a quick read.
 */
export function resolveOpposedD100(
  rollA: number,
  rollB: number,
  targetA: number | null,
  targetB: number | null
): {
  a: SimpleTestResult | null;
  b: SimpleTestResult | null;
  summary: string;
} {
  const hasA = targetA != null && targetA >= 1 && targetA <= 100;
  const hasB = targetB != null && targetB >= 1 && targetB <= 100;
  const a = hasA && targetA != null ? simpleTestVsTarget(rollA, targetA) : null;
  const b = hasB && targetB != null ? simpleTestVsTarget(rollB, targetB) : null;

  if (!hasA && !hasB) {
    return {
      a: null,
      b: null,
      summary:
        'Optional targets: enter 1–100 per side to see pass/fail. Full opposed outcomes (SL, crits) stay in the book.',
    };
  }
  if (hasA && !hasB) {
    return { a, b: null, summary: a!.success ? 'Side A passes (simple test).' : 'Side A fails (simple test).' };
  }
  if (!hasA && hasB) {
    return { a: null, b, summary: b!.success ? 'Side B passes (simple test).' : 'Side B fails (simple test).' };
  }
  if (a!.success && !b!.success) {
    return { a, b, summary: 'Clear read: only A passes—A leads before crits and SL steps.' };
  }
  if (!a!.success && b!.success) {
    return { a, b, summary: 'Clear read: only B passes—B leads before crits and SL steps.' };
  }
  if (a!.success && b!.success) {
    return { a, b, summary: 'Both pass the simple test—compare Success Levels in your book.' };
  }
  return { a, b, summary: 'Both fail the simple test—use opposed rules for two failures in your book.' };
}
