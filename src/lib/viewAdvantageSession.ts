const PREFIX = 'grim-dudes:advantage:';

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Math.floor(n)));
}

/**
 * Combat Advantage at the table (party or GM side, your call)—rough scratch, not a full automation.
 */
export function loadAdvantage(viewKey: string): number {
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

export function saveAdvantage(viewKey: string, value: number): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PREFIX}${viewKey}`, String(clamp(value)));
  } catch {
    // ignore
  }
}

export function nudgeAdvantage(viewKey: string, delta: number): number {
  const next = clamp(loadAdvantage(viewKey) + delta);
  saveAdvantage(viewKey, next);
  return next;
}
