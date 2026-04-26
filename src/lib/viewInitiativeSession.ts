import type { Statblock } from '@/lib/types';

const PREFIX = 'grim-dudes:initiative:';

const ALIGN_BASE = 1000;

const STATE_MAX = 48;

export type InitiativeRow = {
  /** Stable id for React keys and edits */
  key: string;
  name: string;
  initiative: number;
  blockId?: string;
  /** Optional table note: prone, stun, bleeding—your book defines effects. */
  state?: string;
};

function safeParse(json: string | null): InitiativeRow[] {
  if (json == null || json === '') return [];
  try {
    const raw = JSON.parse(json) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((r): InitiativeRow | null => {
        if (r == null || typeof r !== 'object') return null;
        const o = r as Record<string, unknown>;
        const name = typeof o.name === 'string' ? o.name : '';
        const init = typeof o.initiative === 'number' && Number.isFinite(o.initiative) ? o.initiative : 0;
        const key =
          typeof o.key === 'string' && o.key
            ? o.key
            : typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
              ? globalThis.crypto.randomUUID()
              : `k-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const blockId = typeof o.blockId === 'string' && o.blockId ? o.blockId : undefined;
        const state =
          typeof o.state === 'string' && o.state.trim()
            ? o.state.trim().slice(0, STATE_MAX)
            : undefined;
        return { key, name, initiative: init, blockId, state };
      })
      .filter((r): r is InitiativeRow => r != null);
  } catch {
    return [];
  }
}

export function loadInitiativeSession(viewKey: string): InitiativeRow[] {
  if (typeof window === 'undefined') return [];
  try {
    return safeParse(sessionStorage.getItem(`${PREFIX}${viewKey}`));
  } catch {
    return [];
  }
}

export function saveInitiativeSession(viewKey: string, rows: InitiativeRow[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PREFIX}${viewKey}`, JSON.stringify(rows));
  } catch {
    // quota / private mode
  }
}

export function newRow(
  partial: Partial<Pick<InitiativeRow, 'name' | 'initiative' | 'blockId' | 'state'>>
): InitiativeRow {
  const st =
    typeof partial.state === 'string' && partial.state.trim()
      ? partial.state.trim().slice(0, STATE_MAX)
      : undefined;
  return {
    key:
      typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `k-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: partial.name ?? '',
    initiative: typeof partial.initiative === 'number' && Number.isFinite(partial.initiative) ? partial.initiative : 0,
    blockId: partial.blockId,
    state: st,
  };
}

export function sortInitiativeRows(rows: InitiativeRow[]): InitiativeRow[] {
  return [...rows].sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name));
}

/**
 * Set each block-linked row's initiative so that, after the usual high→low sort,
 * order matches `blocks` (top to bottom on the page). Unmatched / manual rows are unchanged.
 * GMs can edit numbers after for real combat order.
 */
export function alignInitiativeToBlockOrder(rows: InitiativeRow[], blocks: Statblock[]): InitiativeRow[] {
  if (blocks.length === 0) return rows;
  return rows.map((r) => {
    if (!r.blockId) return r;
    const idx = blocks.findIndex((b) => String(b.id ?? '') === r.blockId);
    if (idx < 0) return r;
    return { ...r, initiative: ALIGN_BASE - idx };
  });
}
