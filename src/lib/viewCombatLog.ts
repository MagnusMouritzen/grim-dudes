const PREFIX = 'grim-dudes:combat-log:';

type CombatLogListener = () => void;
const combatLogListeners = new Map<string, Set<CombatLogListener>>();

function notifyCombatLogChanged(key: string): void {
  const set = combatLogListeners.get(key);
  if (!set) return;
  for (const fn of set) {
    try {
      fn();
    } catch {
      // ignore
    }
  }
}

/** Re-load the log in other components (e.g. when the d100 roller appends a line). */
export function subscribeCombatLog(key: string, listener: CombatLogListener): () => void {
  if (typeof window === 'undefined') return () => {};
  let set = combatLogListeners.get(key);
  if (!set) {
    set = new Set();
    combatLogListeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) combatLogListeners.delete(key);
  };
}

/**
 * One timestamped line, saved to session storage. Triggers {@link subscribeCombatLog}.
 */
export function appendCombatLogOneLine(key: string, line: string): void {
  if (typeof window === 'undefined') return;
  const t = line.trim();
  if (!t) return;
  const prev = loadCombatLog(key);
  const next = appendCombatLogLine(prev, t, new Date());
  saveCombatLog(key, next);
  notifyCombatLogChanged(key);
}

export function formatCombatLogTimestamp(d: Date): string {
  return d.toTimeString().slice(0, 5);
}

/** Append one timestamped line. Ignores empty `line` (after trim). */
export function appendCombatLogLine(prev: string, line: string, now: Date): string {
  const t = line.trim();
  if (!t) return prev;
  const entry = `[${formatCombatLogTimestamp(now)}] ${t}`;
  const p = prev.trimEnd();
  return p ? `${p}\n${entry}` : entry;
}

export function loadCombatLog(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${key}`);
    return typeof raw === 'string' ? raw : '';
  } catch {
    return '';
  }
}

export function saveCombatLog(key: string, text: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PREFIX}${key}`, text);
  } catch {
    // quota / private mode
  }
}
