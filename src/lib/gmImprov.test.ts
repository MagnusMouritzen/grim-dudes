import { describe, expect, it } from 'vitest';
import { GM_IMPROV_TABLES, pickGmImprov, type GmImprovTableId } from './gmImprov';

const TABLE_IDS: readonly GmImprovTableId[] = [
  'name',
  'complication',
  'atmosphere',
  'weather',
  'street',
  'rumour',
  'motive',
  'voice',
  'twist',
] as const;

describe('gmImprov', () => {
  it('has non-empty tables', () => {
    TABLE_IDS.forEach((id) => {
      expect(GM_IMPROV_TABLES[id].length).toBeGreaterThan(0);
    });
  });

  it('pickGmImprov returns a string from the selected table', () => {
    const id: GmImprovTableId = 'name';
    const s = pickGmImprov(id);
    expect((GM_IMPROV_TABLES[id] as readonly string[]).includes(s)).toBe(true);
  });
});
