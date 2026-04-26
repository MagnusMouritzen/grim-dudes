/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest';
import { loadEncounterLabel, saveEncounterLabel } from './viewEncounterLabel';

const key = 'enc-lab';

describe('viewEncounterLabel', () => {
  afterEach(() => {
    sessionStorage.removeItem(`grim-dudes:encounter-label:${key}`);
  });

  it('round-trips and trims', () => {
    saveEncounterLabel(key, '  Dock fight  ');
    expect(loadEncounterLabel(key)).toBe('Dock fight');
  });

  it('clears when empty save', () => {
    saveEncounterLabel(key, 'x');
    saveEncounterLabel(key, '   ');
    expect(loadEncounterLabel(key)).toBe('');
  });
});
