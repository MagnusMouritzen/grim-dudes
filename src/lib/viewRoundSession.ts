const PREFIX = 'grim-dudes:round:';

type RoundListener = () => void;
const roundListeners = new Map<string, Set<RoundListener>>();

function emitRound(viewKey: string): void {
  const set = roundListeners.get(viewKey);
  if (!set) return;
  for (const fn of set) {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  }
}

/**
 * When the round changes from another component (e.g. "New round" on initiative), the counter UI can stay in sync.
 */
export function subscribeRound(viewKey: string, listener: RoundListener): () => void {
  if (typeof window === 'undefined') return () => {};
  let set = roundListeners.get(viewKey);
  if (!set) {
    set = new Set();
    roundListeners.set(viewKey, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) roundListeners.delete(viewKey);
  };
}

export function loadRound(viewKey: string): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${viewKey}`);
    if (raw == null || raw === '') return 1;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(9999, n);
  } catch {
    return 1;
  }
}

export function saveRound(viewKey: string, round: number): void {
  if (typeof window === 'undefined') return;
  const n = Math.max(1, Math.min(9999, Math.floor(Number.isFinite(round) ? round : 1)));
  try {
    sessionStorage.setItem(`${PREFIX}${viewKey}`, String(n));
  } catch {
    // ignore
  }
  emitRound(viewKey);
}

/** Increment stored round by 1 (capped) and return the new value. */
export function bumpRound(viewKey: string): number {
  const next = Math.min(9999, loadRound(viewKey) + 1);
  saveRound(viewKey, next);
  return next;
}
