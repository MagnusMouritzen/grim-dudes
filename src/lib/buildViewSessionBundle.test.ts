/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest';
import { buildViewSessionBundleMarkdown, buildViewSessionBundlePlain } from './buildViewSessionBundle';
import { saveCombatLog } from './viewCombatLog';
import { saveInitiativeSession } from './viewInitiativeSession';
import { saveSessionNotes } from './viewSessionNotes';
import { saveSceneTime } from './viewSceneTimeSession';
import type { InitiativeRow } from './viewInitiativeSession';

const key = 'bundle-test';

describe('buildViewSessionBundlePlain', () => {
  afterEach(() => {
    sessionStorage.removeItem(`grim-dudes:initiative:${key}`);
    sessionStorage.removeItem(`grim-dudes:session-notes:${key}`);
    sessionStorage.removeItem(`grim-dudes:combat-log:${key}`);
    sessionStorage.removeItem(`grim-dudes:round:${key}`);
    sessionStorage.removeItem(`grim-dudes:scene-time:${key}`);
  });

  it('returns empty when nothing is set', () => {
    expect(buildViewSessionBundlePlain(key).trim()).toBe('');
  });

  it('joins notes and log', () => {
    saveSessionNotes(key, 'next: cellar');
    saveCombatLog(key, '[12:00] hit');
    const t = buildViewSessionBundlePlain(key);
    expect(t).toContain('SESSION NOTES');
    expect(t).toContain('cellar');
    expect(t).toContain('COMBAT & SCENE LOG');
    expect(t).toContain('hit');
  });

  it('includes initiative when rows exist', () => {
    const rows: InitiativeRow[] = [{ key: 'a', name: 'Zed', initiative: 5 }];
    saveInitiativeSession(key, rows);
    const t = buildViewSessionBundlePlain(key);
    expect(t).toContain('Initiative');
    expect(t).toContain('Zed');
  });

  it('prepends scene time when there is no initiative', () => {
    saveSceneTime(key, 'dusk');
    saveSessionNotes(key, 'x');
    const t = buildViewSessionBundlePlain(key);
    expect(t.indexOf('Time: Dusk')).toBeLessThan(t.indexOf('SESSION NOTES'));
  });

  it('does not duplicate time when initiative exists (time is inside initiative block)', () => {
    saveSceneTime(key, 'dusk');
    saveInitiativeSession(key, [{ key: 'a', name: 'Zed', initiative: 5 }]);
    const t = buildViewSessionBundlePlain(key);
    expect(t.split('Time: Dusk').length - 1).toBe(1);
  });

  it('builds markdown with headings for notes and log', () => {
    saveSessionNotes(key, 'beat');
    saveCombatLog(key, '[12:00] x');
    const t = buildViewSessionBundleMarkdown(key);
    expect(t).toContain('## Session notes');
    expect(t).toContain('beat');
    expect(t).toContain('## Combat & scene log');
  });

  it('markdown bundle prepends time without initiative', () => {
    saveSceneTime(key, 'night');
    const t = buildViewSessionBundleMarkdown(key);
    expect(t.startsWith('*Time: Night*')).toBe(true);
  });
});
