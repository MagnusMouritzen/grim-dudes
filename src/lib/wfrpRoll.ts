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
 * Tens "column" of a Target Number (1–100) for WFRP 4e Success Level: 1–9 → 0, 10–99 → 10s digit, 100 → 10.
 */
export function wfrpTargetTensColumn(target: number): number {
  const t = Math.max(1, Math.min(100, Math.floor(target)));
  if (t < 10) return 0;
  if (t === 100) return 10;
  return Math.floor(t / 10);
}

/**
 * Tens column of a d100 roll (1–100) for SL. On a failed test, 100 counts as 10 (fumble / worst 10s).
 * On a successful test, 100 never occurs; pass `failed: false` for 100 and it is unused.
 */
export function wfrpRollTensColumn(roll: number, failed: boolean): number {
  const r = Math.max(1, Math.min(100, Math.floor(roll)));
  if (r === 100) return failed ? 10 : 0;
  if (r < 10) return 0;
  return Math.floor(r / 10);
}

/**
 * WFRP 4e standard test: success if roll &lt; 100 and roll ≤ target (roll 100 always fails). Success Level
 * is the target 10s column minus the roll 10s column. Criticals / miscasts still use the rulebook and tables
 * in this app—only the core SL number is provided.
 */
export function wfrp4SuccessLevel(roll: number, target: number): {
  roll: number;
  target: number;
  success: boolean;
  sl: number;
} {
  const t = Math.max(1, Math.min(100, Math.floor(target)));
  const r = Math.max(1, Math.min(100, Math.floor(roll)));
  const success = r < 100 && r <= t;
  const tCol = wfrpTargetTensColumn(t);
  const rCol = wfrpRollTensColumn(r, !success);
  const sl = tCol - rCol;
  return { roll: r, target: t, success, sl };
}

/**
 * Unmodified test: success if roll ≤ target (after the GM applies final target number).
 * 01 often treated as critical success; 100 as fumble in many tables — caller can style.
 */
export function simpleTestVsTarget(roll: number, target: number): SimpleTestResult {
  const t = Math.max(0, Math.min(100, Math.floor(target)));
  const r = Math.max(1, Math.min(100, Math.floor(roll)));
  const success = r < 100 && r <= t;
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
    const sLa = wfrp4SuccessLevel(rollA, targetA!);
    const sLb = wfrp4SuccessLevel(rollB, targetB!);
    const fa = sLa.sl >= 0 ? `+${sLa.sl}` : String(sLa.sl);
    const fb = sLb.sl >= 0 ? `+${sLb.sl}` : String(sLb.sl);
    const cmp =
      sLa.sl > sLb.sl
        ? 'A is ahead (higher SL).'
        : sLb.sl > sLa.sl
          ? 'B is ahead (higher SL).'
          : 'Tie on SL—use your book (e.g. attacker wins or re-roll).';
    return {
      a,
      b,
      summary: `Both pass—A SL ${fa}, B SL ${fb}. ${cmp}`,
    };
  }
  return { a, b, summary: 'Both fail the simple test—use opposed rules for two failures in your book.' };
}
