import { describe, it, expect } from 'vitest';
import { buildEncounterPlainText, buildStatblockPlainText, encounterSummaryLine } from './encounterSheet';
import type { Statblock } from './types';

describe('encounterSummaryLine', () => {
  it('uses first line of playerNotes', () => {
    expect(
      encounterSummaryLine({
        playerNotes: 'A hulking shape.\nSecond line',
      } as import('./types').Statblock)
    ).toBe('A hulking shape.');
  });

  it('falls back to first trait', () => {
    expect(
      encounterSummaryLine({
        traits: ['Undead', 'Fear'],
      } as import('./types').Statblock)
    ).toBe('Undead');
  });
});

describe('buildEncounterPlainText', () => {
  it('includes title, one line per block, and view URL', () => {
    const blocks: Statblock[] = [
      { id: 'g', name: 'Goblin', wounds: 8, movement: 4 } as Statblock,
    ];
    const text = buildEncounterPlainText({
      title: 'Ambush',
      blocks,
      traitsRef: [],
      viewUrl: 'https://example.com/view',
    });
    expect(text).toContain('Ambush');
    expect(text).toContain('Goblin');
    expect(text).toContain('https://example.com/view');
  });
});

describe('buildStatblockPlainText', () => {
  it('includes name, W/M, summary line, url', () => {
    const text = buildStatblockPlainText(
      { id: 'x', name: 'Rat', wounds: 5, movement: 3 } as Statblock,
      [],
      'https://example.com/statblock/x'
    );
    expect(text).toContain('Rat');
    expect(text).toContain('Wounds');
    expect(text).toContain('https://example.com/statblock/x');
  });
});
