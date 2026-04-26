const PREFIX = 'grim-dudes:session-xp:';

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(999, Math.floor(n)));
}

/** XP penciled for this session / encounter page—not written to any stat block. */
export function loadSessionXp(viewKey: string): number {
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

export function saveSessionXp(viewKey: string, value: number): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PREFIX}${viewKey}`, String(clamp(value)));
  } catch {
    // ignore
  }
}

export function nudgeSessionXp(viewKey: string, delta: number): number {
  const next = clamp(loadSessionXp(viewKey) + delta);
  saveSessionXp(viewKey, next);
  return next;
}
