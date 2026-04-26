const KEY = 'grim-dudes:last-encounter-roster';

function getLs(): Storage | null {
  try {
    if (typeof globalThis === 'undefined') return null;
    return 'localStorage' in globalThis ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

/** Same-tab: components can listen to refresh the “last encounter” link without a full reload. */
export const LAST_ENCOUNTER_EVENT = 'grim-dudes:last-encounter';

export type RememberedRoster = { slug: string; name: string; at: number };

/**
 * Browsers only — stores the most recently opened saved encounter roster (slug + display name) for
 * a one-click “resume” in the header. Not an account; local device only.
 */
export function rememberRosterView(slug: string, name: string): void {
  const ls = getLs();
  if (!ls) return;
  const s = String(slug).trim();
  if (!s) return;
  const n = String(name).trim() || s;
  try {
    ls.setItem(KEY, JSON.stringify({ slug: s, name: n, at: Date.now() } satisfies RememberedRoster));
  } catch {
    // ignore quota
  }
  try {
    globalThis.dispatchEvent(new Event(LAST_ENCOUNTER_EVENT));
  } catch {
    // ignore
  }
}

export function getRememberedRoster(): RememberedRoster | null {
  const ls = getLs();
  if (!ls) return null;
  try {
    const raw = ls.getItem(KEY);
    if (raw == null || raw === '') return null;
    const o = JSON.parse(raw) as unknown;
    if (o == null || typeof o !== 'object') return null;
    const slug = (o as { slug?: unknown }).slug;
    const name = (o as { name?: unknown }).name;
    if (typeof slug !== 'string' || !slug.trim()) return null;
    const nameStr = typeof name === 'string' && name.trim() ? name.trim() : slug.trim();
    const atRaw = (o as { at?: unknown }).at;
    const at =
      typeof atRaw === 'number' && Number.isFinite(atRaw) ? atRaw : Date.now();
    return { slug: slug.trim(), name: nameStr, at };
  } catch {
    return null;
  }
}

export function clearRememberedRoster(): void {
  const ls = getLs();
  if (!ls) return;
  try {
    ls.removeItem(KEY);
  } catch {
    // ignore
  }
}
