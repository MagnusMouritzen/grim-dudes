import { describe, it, expect } from 'vitest';
import { validateStatblockPayload } from './validateStatblock';

describe('validateStatblockPayload', () => {
  it('accepts minimal empty payload', () => {
    const res = validateStatblockPayload({});
    expect(res.ok).toBe(true);
  });

  it('accepts a flat NPC', () => {
    const res = validateStatblockPayload({
      id: 'human-thug',
      name: 'Human Thug',
      characteristics: { WS: 30, BS: 25, S: 35, T: 35, I: 25, Ag: 30, Dex: 20, Int: 25, WP: 25, Fel: 30 },
      size: 'Average',
      wounds: 13,
      movement: 4,
      skills: [{ name: 'Intimidate', advances: 10 }],
      talents: ['Menacing'],
      traits: ['Prejudice'],
      tags: ['human'],
    });
    expect(res.ok).toBe(true);
  });

  it('rejects unknown fields (strict)', () => {
    const res = validateStatblockPayload({ extra: true });
    expect(res.ok).toBe(false);
  });

  it('rejects invalid characteristic shape', () => {
    const res = validateStatblockPayload({ characteristics: { WS: 'a lot' } });
    expect(res.ok).toBe(false);
  });

  it('rejects oversized skills array', () => {
    const skills = Array.from({ length: 500 }, (_, i) => ({ name: `s${i}`, advances: 0 }));
    const res = validateStatblockPayload({ skills });
    expect(res.ok).toBe(false);
  });
});
