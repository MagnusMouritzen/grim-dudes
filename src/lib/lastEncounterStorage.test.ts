import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLastEncounter,
  getLastEncounter,
  getRememberedRoster,
  rememberIdsView,
  rememberPackView,
  rememberRosterView,
} from './lastEncounterStorage';

const LEGACY = 'grim-dudes:last-encounter-roster';

const mem = new Map<string, string>();

function mockStorage() {
  const ls = {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };
  vi.stubGlobal('localStorage', ls);
  // EventTarget: minimal shape for dispatch
  if (!('dispatchEvent' in globalThis) || typeof globalThis.dispatchEvent !== 'function') {
    vi.stubGlobal('dispatchEvent', vi.fn());
  }
}

beforeEach(() => {
  mem.clear();
  mockStorage();
});

afterEach(() => {
  clearLastEncounter();
  vi.unstubAllGlobals();
});

describe('lastEncounterStorage', () => {
  it('round-trips slug and name', () => {
    rememberRosterView('docks-001', 'Dock watch');
    const r = getRememberedRoster();
    expect(r).not.toBeNull();
    expect(r!.slug).toBe('docks-001');
    expect(r!.name).toBe('Dock watch');
  });

  it('uses slug as name if name empty', () => {
    rememberRosterView('ab', '   ');
    const r = getRememberedRoster();
    expect(r?.name).toBe('ab');
  });

  it('ignores empty slug', () => {
    rememberRosterView('', 'x');
    expect(getRememberedRoster()).toBeNull();
  });

  it('rememberPackView stores share link', () => {
    rememberPackView('abc12');
    const e = getLastEncounter();
    expect(e?.kind).toBe('pack');
    if (e?.kind === 'pack') expect(e.packId).toBe('abc12');
  });

  it('rememberIdsView stores list view (getRememberedRoster null when last is ids)', () => {
    rememberIdsView(['a', 'b'], 'Scuffle');
    const e = getLastEncounter();
    expect(e?.kind).toBe('ids');
    if (e?.kind === 'ids') {
      expect(e.ids).toEqual(['a', 'b']);
      expect(e.title).toBe('Scuffle');
    }
    expect(getRememberedRoster()).toBeNull();
  });

  it('migrates legacy last-encounter-roster into unified key on read', () => {
    mem.set(
      LEGACY,
      JSON.stringify({ slug: 'old-slug', name: 'Legacy name', at: 1 })
    );
    const e = getLastEncounter();
    expect(e?.kind).toBe('roster');
    if (e?.kind === 'roster') {
      expect(e.slug).toBe('old-slug');
      expect(e.name).toBe('Legacy name');
    }
  });
});
