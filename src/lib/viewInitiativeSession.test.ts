import { describe, it, expect } from 'vitest';
import {
  alignInitiativeToBlockOrder,
  newRow,
  sortInitiativeRows,
  type InitiativeRow,
} from './viewInitiativeSession';
import type { Statblock } from './types';

describe('newRow', () => {
  it('accepts state', () => {
    const r = newRow({ name: 'A', state: ' Prone ' });
    expect(r.state).toBe('Prone');
  });
});

describe('sortInitiativeRows', () => {
  it('orders by initiative descending then name', () => {
    const rows: InitiativeRow[] = [
      { key: '1', name: 'B', initiative: 3 },
      { key: '2', name: 'A', initiative: 3 },
      { key: '3', name: 'C', initiative: 10 },
    ];
    const s = sortInitiativeRows(rows);
    expect(s.map((r) => r.name)).toEqual(['C', 'A', 'B']);
  });
});

describe('alignInitiativeToBlockOrder', () => {
  it('assigns higher init to earlier stat blocks so sort matches page order', () => {
    const blocks: Statblock[] = [
      { id: 'a', name: 'A' } as Statblock,
      { id: 'b', name: 'B' } as Statblock,
    ];
    const rows: InitiativeRow[] = [
      { key: 'k1', name: 'B', initiative: 0, blockId: 'b' },
      { key: 'k2', name: 'A', initiative: 0, blockId: 'a' },
    ];
    const aligned = alignInitiativeToBlockOrder(rows, blocks);
    const sorted = sortInitiativeRows(aligned);
    expect(sorted.map((r) => r.blockId)).toEqual(['a', 'b']);
  });

  it('leaves rows without blockId alone', () => {
    const blocks: Statblock[] = [{ id: 'a', name: 'A' } as Statblock];
    const rows: InitiativeRow[] = [
      { key: 'k1', name: 'Loose', initiative: 99 },
    ];
    expect(alignInitiativeToBlockOrder(rows, blocks)[0]?.initiative).toBe(99);
  });
});
