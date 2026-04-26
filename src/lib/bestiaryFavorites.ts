const STORAGE_KEY = 'grim-dudes:bestiary-favorites';

/** JSON stored in localStorage; sorted for stable diffs. */
export function serializeFavoriteIds(ids: Set<string>): string {
  return JSON.stringify([...ids].sort());
}

export function parseFavoriteIdsJson(raw: string | null | undefined): Set<string> {
  if (raw == null || raw === '') return new Set();
  try {
    const a = JSON.parse(raw) as unknown;
    if (!Array.isArray(a)) return new Set();
    return new Set(a.filter((x): x is string => typeof x === 'string' && x.length > 0));
  } catch {
    return new Set();
  }
}

export function loadFavoriteIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return parseFavoriteIdsJson(localStorage.getItem(STORAGE_KEY));
  } catch {
    return new Set();
  }
}

export function saveFavoriteIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, serializeFavoriteIds(ids));
  } catch {
    // quota / private mode
  }
}
