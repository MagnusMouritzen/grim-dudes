/**
 * Humanoid random hit location on d100 (1–100). These bands are a common 4e-style layout; your
 * group should still use the WFRP 4e book for the authoritative table, armour by location, and crits.
 */
export const WFRP4_HUMANOID_HIT_ZONES: { min: number; max: number; label: string }[] = [
  { min: 1, max: 9, label: 'Head' },
  { min: 10, max: 14, label: 'Right arm' },
  { min: 15, max: 19, label: 'Left arm' },
  { min: 20, max: 44, label: 'Body' },
  { min: 45, max: 64, label: 'Right leg' },
  { min: 65, max: 84, label: 'Left leg' },
  { min: 85, max: 100, label: 'Head' },
];

export function humanoidHitLocation(roll: number): { roll: number; label: string } {
  const r = Math.max(1, Math.min(100, Math.floor(roll)));
  for (const z of WFRP4_HUMANOID_HIT_ZONES) {
    if (r >= z.min && r <= z.max) return { roll: r, label: z.label };
  }
  return { roll: r, label: 'Body' };
}
