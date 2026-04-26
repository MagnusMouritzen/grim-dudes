import { describe, it, expect } from 'vitest';
import { computeEffectiveStats, buildArmourTable, getCharacteristicValue } from './statblockDerived';
import type { Statblock, TraitRef, ArmourRef } from './types';

const flat30 = {
  WS: 30,
  BS: 30,
  S: 30,
  T: 30,
  I: 30,
  Ag: 30,
  Dex: 30,
  Int: 30,
  WP: 30,
  Fel: 30,
};

describe('statblockDerived', () => {
  it('getCharacteristicValue reads flat and template shapes', () => {
    expect(getCharacteristicValue({ characteristics: { WS: 41 } } as Statblock, 'WS')).toBe(41);
    expect(
      getCharacteristicValue(
        { characteristics: { WS: { base: 20, advances: 5, addition: 10 } } } as Statblock,
        'WS'
      )
    ).toBe(35);
  });

  it('computeEffectiveStats applies trait characteristic modifiers', () => {
    const block: Statblock = {
      characteristics: { ...flat30 },
      size: 'Average',
      movement: 4,
      traits: [{ name: 'Stronger' }],
    };
    const traitsRef: TraitRef[] = [
      { name: 'Stronger', effects: { characteristics: { S: 10 } } },
    ];
    const { effectiveCh, effectiveMovement, effectiveWounds } = computeEffectiveStats(block, traitsRef);
    expect(effectiveCh.S).toBe(40);
    expect(effectiveMovement).toBe(4);
    expect(effectiveWounds).toBe(13);
  });

  it('buildArmourTable stacks AP and TB by location', () => {
    const block: Statblock = {
      characteristics: { ...flat30, T: 40 },
      armour: [{ category: 'Soft Leather', name: 'Leather Jack' }],
    };
    const armourRef: ArmourRef = {
      armour: {
        categories: [
          {
            name: 'Soft Leather',
            items: [
              {
                name: 'Leather Jack',
                aps: 1,
                locations: ['Body', 'Arms'],
              },
            ],
          },
        ],
      },
    };
    const effectiveCh = { ...flat30, T: 40 };
    const rows = buildArmourTable(block, armourRef, effectiveCh);
    const body = rows.find((r) => r.location === 'Body');
    expect(body?.protection).toBe(5);
  });
});
