const PREFIX = 'grim-dudes:encounter-label:';

const MAX = 120;

function trimLabel(s: string): string {
  return s.replace(/\s+/g, ' ').trim().slice(0, MAX);
}

/** Optional name for this encounter page (Discord, notes, pasted initiative). */
export function loadEncounterLabel(viewKey: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${viewKey}`);
    if (raw == null || raw === '') return '';
    return trimLabel(typeof raw === 'string' ? raw : '');
  } catch {
    return '';
  }
}

export function saveEncounterLabel(viewKey: string, text: string): void {
  if (typeof window === 'undefined') return;
  const t = trimLabel(text);
  try {
    if (t === '') {
      sessionStorage.removeItem(`${PREFIX}${viewKey}`);
    } else {
      sessionStorage.setItem(`${PREFIX}${viewKey}`, t);
    }
  } catch {
    // ignore
  }
}
