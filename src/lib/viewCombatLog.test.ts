/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import {
  appendCombatLogLine,
  appendCombatLogOneLine,
  formatCombatLogTimestamp,
  loadCombatLog,
  subscribeCombatLog,
} from './viewCombatLog';

describe('viewCombatLog', () => {
  it('formatCombatLogTimestamp uses local hours:minutes', () => {
    const d = new Date(2026, 3, 25, 20, 7, 0);
    expect(formatCombatLogTimestamp(d)).toBe('20:07');
  });

  it('appendCombatLogLine leaves prev unchanged for blank line', () => {
    const d = new Date(2026, 3, 25, 12, 0, 0);
    expect(appendCombatLogLine('a', '   ', d)).toBe('a');
  });

  it('appendCombatLogLine adds first line or appends with newline', () => {
    const d = new Date(2026, 3, 25, 9, 30, 0);
    expect(appendCombatLogLine('', 'first', d)).toBe('[09:30] first');
    expect(appendCombatLogLine('[09:30] a', 'b', d)).toBe('[09:30] a\n[09:30] b');
  });
});

describe('appendCombatLogOneLine', () => {
  const key = 'log-test-key';

  it('persists and notifies subscribers', () => {
    sessionStorage.removeItem(`grim-dudes:combat-log:${key}`);
    const fn = vi.fn();
    const unsub = subscribeCombatLog(key, fn);
    appendCombatLogOneLine(key, 'd100: 44 (Perception)');
    expect(loadCombatLog(key)).toContain('d100: 44');
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
  });
});
