const PREFIX = 'grim-dudes:tension:';

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(8, Math.floor(n)));
}

/**
 * 0 = calm, 8 = as bad as the slider allows—use for pacing, not a specific rule.
 */
export function loadTension(viewKey: string): number {
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

export function saveTension(viewKey: string, value: number): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PREFIX}${viewKey}`, String(clamp(value)));
  } catch {
    // ignore
  }
}

export function nudgeTension(viewKey: string, delta: number): number {
  const next = clamp(loadTension(viewKey) + delta);
  saveTension(viewKey, next);
  return next;
}
