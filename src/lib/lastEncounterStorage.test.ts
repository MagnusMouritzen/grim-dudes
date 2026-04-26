import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearRememberedRoster, getRememberedRoster, rememberRosterView } from './lastEncounterStorage';

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
  clearRememberedRoster();
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
});
