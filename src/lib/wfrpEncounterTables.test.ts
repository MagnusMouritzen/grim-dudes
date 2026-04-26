import { describe, expect, it } from 'vitest';
import { rollWfrpEncounterTable, WFRP_ENCOUNTER_TABLES, type WfrpEncounterTableId } from './wfrpEncounterTables';

const IDS: WfrpEncounterTableId[] = ['disposition', 'mishap', 'chase', 'social'];

describe('WFRP_ENCOUNTER_TABLES', () => {
  it('has non-empty rows and expected sizes', () => {
    expect(WFRP_ENCOUNTER_TABLES.disposition.rows).toHaveLength(6);
    expect(WFRP_ENCOUNTER_TABLES.mishap.rows).toHaveLength(10);
    expect(WFRP_ENCOUNTER_TABLES.chase.rows).toHaveLength(8);
    expect(WFRP_ENCOUNTER_TABLES.social.rows).toHaveLength(6);
    for (const id of IDS) {
      for (const line of WFRP_ENCOUNTER_TABLES[id].rows) {
        expect(line.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('rollWfrpEncounterTable', () => {
  it('returns die in range and matching row text', () => {
    for (const id of IDS) {
      for (let i = 0; i < 80; i++) {
        const r = rollWfrpEncounterTable(id);
        const sides = WFRP_ENCOUNTER_TABLES[id].rows.length;
        expect(r.id).toBe(id);
        expect(r.die).toBeGreaterThanOrEqual(1);
        expect(r.die).toBeLessThanOrEqual(sides);
        expect(r.text).toBe(WFRP_ENCOUNTER_TABLES[id].rows[r.die - 1]);
        expect(r.text.length).toBeGreaterThan(0);
      }
    }
  });
});
