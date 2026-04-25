const PREFIX = 'grim-dudes:fortune:';

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(99, Math.floor(n)));
}

/**
 * Crude 0–99 scratch counter for the table (e.g. who still has Fortune)—not a character sheet.
 */
export function loadFortune(viewKey: string): number {
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

export function saveFortune(viewKey: string, value: number): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PREFIX}${viewKey}`, String(clamp(value)));
  } catch {
    // ignore
  }
}

export function nudgeFortune(viewKey: string, delta: number): number {
  const next = clamp(loadFortune(viewKey) + delta);
  saveFortune(viewKey, next);
  return next;
}
