/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest';
import {
  formatSceneTimeMdLine,
  formatSceneTimePlainLine,
  loadSceneTime,
  saveSceneTime,
} from './viewSceneTimeSession';

const k = 'scene-time-test';

describe('viewSceneTimeSession', () => {
  afterEach(() => {
    saveSceneTime(k, '');
  });

  it('round-trips a value', () => {
    expect(loadSceneTime(k)).toBe('');
    saveSceneTime(k, 'dusk');
    expect(loadSceneTime(k)).toBe('dusk');
  });

  it('ignores invalid stored values', () => {
    sessionStorage.setItem('grim-dudes:scene-time:' + k, 'nope');
    expect(loadSceneTime(k)).toBe('');
  });

  it('format lines are empty when off', () => {
    expect(formatSceneTimePlainLine(k)).toBe('');
    expect(formatSceneTimeMdLine(k)).toBe('');
  });

  it('format plain and md when set', () => {
    saveSceneTime(k, 'night');
    expect(formatSceneTimePlainLine(k)).toBe('Time: Night');
    expect(formatSceneTimeMdLine(k)).toBe('*Time: Night*');
  });

  it('late slot uses a compact export label', () => {
    saveSceneTime(k, 'late');
    expect(formatSceneTimePlainLine(k)).toBe('Time: Very late');
  });
});
