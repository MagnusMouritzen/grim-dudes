const PREFIX = 'grim-dudes:d100-history:';

export const D100_HISTORY_MAX = 10;

export type D100HistoryEntry = {
  roll: number;
  /** Optional label from the roller (e.g. Perception). */
  tag?: string;
};

function clampRoll(r: number): number {
  return Math.max(1, Math.min(100, Math.floor(r)));
}

function normalizeEntry(x: unknown): D100HistoryEntry | null {
  if (typeof x === 'number' && Number.isFinite(x)) {
    return { roll: clampRoll(x) };
  }
  if (x != null && typeof x === 'object' && 'roll' in x) {
    const r = (x as { roll: unknown }).roll;
    if (typeof r === 'number' && Number.isFinite(r)) {
      const base: D100HistoryEntry = { roll: clampRoll(r) };
      const t = (x as { tag?: unknown }).tag;
      if (typeof t === 'string' && t.trim()) {
        base.tag = t.trim().slice(0, 24);
      }
      return base;
    }
  }
  return null;
}

function safeParse(json: string | null): D100HistoryEntry[] {
  if (json == null || json === '') return [];
  try {
    const raw = JSON.parse(json) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeEntry).filter((e): e is D100HistoryEntry => e != null);
  } catch {
    return [];
  }
}

export function mergeD100History(
  prev: D100HistoryEntry[],
  roll: number,
  tag?: string | null
): D100HistoryEntry[] {
  const r = clampRoll(roll);
  const t = tag == null || tag === '' ? undefined : String(tag).trim().slice(0, 24) || undefined;
  const entry: D100HistoryEntry = t ? { roll: r, tag: t } : { roll: r };
  return [entry, ...prev].slice(0, D100_HISTORY_MAX);
}

export function loadD100History(key: string): D100HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return safeParse(sessionStorage.getItem(`${PREFIX}${key}`));
  } catch {
    return [];
  }
}

export function saveD100History(key: string, rolls: D100HistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify(rolls));
  } catch {
    // ignore
  }
}

export function pushD100Roll(key: string, roll: number, tag?: string | null): D100HistoryEntry[] {
  const next = mergeD100History(loadD100History(key), roll, tag);
  saveD100History(key, next);
  return next;
}

export function clearD100History(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // ignore
  }
}

export function formatD100HistoryEntry(e: D100HistoryEntry): string {
  if (e.tag) return `${e.tag} ${e.roll}`;
  return String(e.roll);
}
