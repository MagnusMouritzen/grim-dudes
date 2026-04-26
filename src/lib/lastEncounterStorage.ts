const KEY = 'grim-dudes:last-encounter';
/** Migrated on read; older client builds only set this. */
const LEGACY_ROSTER_KEY = 'grim-dudes:last-encounter-roster';

const MAX_IDS = 48;
const MAX_ID_LEN = 80;
const MAX_TITLE = 100;

function getLs(): Storage | null {
  try {
    if (typeof globalThis === 'undefined') return null;
    return 'localStorage' in globalThis ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

/** Same-tab: header chip listens for this. */
export const LAST_ENCOUNTER_EVENT = 'grim-dudes:last-encounter';

export type LastEncounter =
  | { kind: 'roster'; slug: string; name: string; at: number }
  | { kind: 'ids'; ids: string[]; title: string | null; at: number };

export type RememberedRoster = { slug: string; name: string; at: number };

function dispatch() {
  try {
    globalThis.dispatchEvent(new Event(LAST_ENCOUNTER_EVENT));
  } catch {
    // ignore
  }
}

function persist(e: LastEncounter) {
  const ls = getLs();
  if (!ls) return;
  try {
    const json = JSON.stringify(e);
    if (json.length > 12_000) return;
    ls.setItem(KEY, json);
  } catch {
    // ignore quota
  }
  dispatch();
}

function migrateLegacyRoster(ls: Storage): LastEncounter | null {
  const raw = ls.getItem(LEGACY_ROSTER_KEY);
  if (raw == null || raw === '') return null;
  try {
    const o = JSON.parse(raw) as { slug?: unknown; name?: unknown; at?: unknown };
    if (o == null || typeof o !== 'object') return null;
    const slug = o.slug;
    if (typeof slug !== 'string' || !slug.trim()) return null;
    const name =
      typeof o.name === 'string' && o.name.trim() ? o.name.trim() : slug.trim();
    const at =
      typeof o.at === 'number' && Number.isFinite(o.at) ? o.at : Date.now();
    const e: LastEncounter = { kind: 'roster', slug: slug.trim(), name, at };
    try {
      ls.setItem(KEY, JSON.stringify(e));
      ls.removeItem(LEGACY_ROSTER_KEY);
    } catch {
      // ignore
    }
    return e;
  } catch {
    return null;
  }
}

/**
 * Browsers only — one “last opened” entry (saved roster or ad-hoc ids view). Not an account; local only.
 */
export function getLastEncounter(): LastEncounter | null {
  const ls = getLs();
  if (!ls) return null;
  try {
    const raw = ls.getItem(KEY);
    if (raw == null || raw === '') {
      return migrateLegacyRoster(ls);
    }
    const o = JSON.parse(raw) as unknown;
    if (o == null || typeof o !== 'object') return null;
    const kind = (o as { kind?: unknown }).kind;
    const at =
      typeof (o as { at?: unknown }).at === 'number' &&
      Number.isFinite((o as { at: number }).at)
        ? (o as { at: number }).at
        : Date.now();
    if (kind === 'roster') {
      const slug = (o as { slug?: unknown }).slug;
      const name = (o as { name?: unknown }).name;
      if (typeof slug !== 'string' || !slug.trim()) return null;
      const nameStr =
        typeof name === 'string' && name.trim() ? name.trim() : slug.trim();
      return { kind: 'roster', slug: slug.trim(), name: nameStr, at };
    }
    if (kind === 'ids') {
      const idsRaw = (o as { ids?: unknown }).ids;
      if (!Array.isArray(idsRaw)) return null;
      const ids: string[] = [];
      for (const x of idsRaw) {
        if (typeof x !== 'string' || !x.trim()) continue;
        const s = x.trim().slice(0, MAX_ID_LEN);
        if (s) ids.push(s);
        if (ids.length >= MAX_IDS) break;
      }
      if (ids.length === 0) return null;
      const titleV = (o as { title?: unknown }).title;
      const title =
        titleV == null
          ? null
          : typeof titleV === 'string'
            ? titleV.trim().slice(0, MAX_TITLE) || null
            : null;
      return { kind: 'ids', ids, title, at };
    }
    return null;
  } catch {
    return null;
  }
}

/** @deprecated use {@link getLastEncounter} */
export function getRememberedRoster(): RememberedRoster | null {
  const e = getLastEncounter();
  if (e == null || e.kind !== 'roster') return null;
  return { slug: e.slug, name: e.name, at: e.at };
}

export function rememberRosterView(slug: string, name: string): void {
  const s = String(slug).trim();
  if (!s) return;
  const n = String(name).trim() || s;
  persist({ kind: 'roster', slug: s, name: n, at: Date.now() });
}

/**
 * Ad-hoc “View together” (no saved roster / share pack). Ids and title are clamped; invalid input is a no-op.
 */
export function rememberIdsView(ids: string[], title: string | null): void {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of ids) {
    if (typeof x !== 'string') continue;
    const t = x.trim().slice(0, MAX_ID_LEN);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= MAX_IDS) break;
  }
  if (out.length === 0) return;
  const t =
    title == null
      ? null
      : String(title).trim().slice(0, MAX_TITLE) || null;
  persist({ kind: 'ids', ids: out, title: t, at: Date.now() });
}

export function clearLastEncounter(): void {
  const ls = getLs();
  if (!ls) return;
  try {
    ls.removeItem(KEY);
    ls.removeItem(LEGACY_ROSTER_KEY);
  } catch {
    // ignore
  }
}

/** @deprecated use {@link clearLastEncounter} */
export function clearRememberedRoster(): void {
  clearLastEncounter();
}
