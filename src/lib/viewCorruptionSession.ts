const PREFIX = 'grim-dudes:corruption:';

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(99, Math.floor(n)));
}

/**
 * Session scratch for “how bad is the party’s taint this scene”—not a character sheet, not rules-enforced.
 */
export function loadCorruption(viewKey: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${viewKey}`);
    if (raw == null || raw === '') return 0;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) return 0;
    return clamp(n);
  } catch {
    return 0;
  }
}

export function saveCorruption(viewKey: string, value: number): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PREFIX}${viewKey}`, String(clamp(value)));
  } catch {
    // ignore
  }
}

export function nudgeCorruption(viewKey: string, delta: number): number {
  const next = clamp(loadCorruption(viewKey) + delta);
  saveCorruption(viewKey, next);
  return next;
}
