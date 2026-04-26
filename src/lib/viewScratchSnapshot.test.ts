import { describe, expect, it } from 'vitest';
import { formatScratchClipFooter, type ScratchValues } from './viewScratchSnapshot';

const zero = (): ScratchValues => ({
  fortune: 0,
  sessionXp: 0,
  tension: 0,
  advantage: 0,
  corruption: 0,
});

describe('formatScratchClipFooter', () => {
  it('returns null when all zero', () => {
    expect(formatScratchClipFooter(zero())).toBeNull();
  });

  it('builds a line for any non-zero part', () => {
    const o = formatScratchClipFooter({ ...zero(), fortune: 2, tension: 3, corruption: 1 });
    expect(o).not.toBeNull();
    expect(o!.plain).toContain('Fortune 2');
    expect(o!.plain).toContain('Tension 3/8');
    expect(o!.plain).toContain('Corruption (scratch) 1');
    expect(o!.md).toContain('*Table (scratch):*');
  });
});
