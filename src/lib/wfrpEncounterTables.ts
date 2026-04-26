/**
 * Original encounter prompt tables (not WFRP rulebook text).
 * Use for atmosphere and GM prompts—your book rules for tests, fear, fumbles, etc.
 */

const DISPOSITION = [
  'Ice-cold courtesy: help if it costs them nothing; warmth costs extra.',
  'Curious, but prices every answer in small favours or time.',
  'Hostile until someone names a mutual friend or a debt.',
  'Hungry for news; treats gossip as coin and hands more back to keep you talking.',
  'Terrified of being seen with you: whispers, alleys, or nothing at all.',
  'Openly friendly—worry is what they will ask for when the second cup is poured.',
] as const;

const MISHAP = [
  'Gear snags: belt, strap, or scabbard—costs attention or the next beat to free.',
  'Footing goes: one false step, almost nothing, almost a fall; eyes leave the line.',
  'A witness gasps; everyone looks at the wrong person at the wrong time.',
  'Sun, smoke, dust, or blood in the eye—one action with murky sight (you rule the penalty).',
  'Something loud hits stone or wood: attention snaps to sound, not strategy.',
  'A door or shutter slams; startle, not quite harm—unless the jump costs balance.',
  'A friend or bystander stumbles into a swing, a line of sight, or a charge.',
  'Weather or draft turns for a moment: mud, sleet, ash, a gust in the lantern.',
  'Kit shifts: quiver loose, pack strap creaks, a strap you forgot about bites.',
  'The right tool is two paces off; improvisation, delay, or a bad substitute.',
] as const;

const CHASE = [
  'Dead end—unless someone climbs what decorum says they should not.',
  'A cart forces the issue: part the crowd, grab a rail, or be left behind.',
  'A span is up or a rope ferry leaves; the river does not care who is guilty.',
  'A whistle, a bell, a second set of boots: pursuit has company.',
  'A gate or courtyard is locked; laundry, scaffold, or spite becomes a path.',
  'Animals panic: horse shies, geese, dog fight—the lane is chaos for a breath.',
  'Narrow stairs or bridge planks: the leader risks a shove; the last risks being cut off.',
  'The runner ducks in somewhere you have been before—memories, not always help.',
] as const;

const SOCIAL_STAKES = [
  'Pride: to yield looks like weakness in front of the people who are watching.',
  'Coin: every word is a price; the room keeps score on purses, not principles.',
  'A secret that is not quite yours; silence is a gift someone else paid for.',
  'Family, guild, or crew—names that turn a joke into a debt.',
  'Law, seal, or writ: formal language with teeth if someone reaches for a badge.',
  'Everyone knows the next step is blades if voices fail; the hush is not peace.',
] as const;

export const WFRP_ENCOUNTER_TABLES = {
  disposition: { label: 'Disposition', help: 'First read on an NPC or crowd toward the party.', rows: DISPOSITION },
  mishap: { label: 'Mishap', help: 'A beat when you want friction—not the official fumble table.', rows: MISHAP },
  chase: { label: 'Chase', help: 'A beat during pursuit, a race, or a fleeing scene.', rows: CHASE },
  social: { label: 'Social stake', help: 'What is on the line in a tense exchange (beyond HP).', rows: SOCIAL_STAKES },
} as const;

export type WfrpEncounterTableId = keyof typeof WFRP_ENCOUNTER_TABLES;

export function rollWfrpEncounterTable(id: WfrpEncounterTableId): { id: WfrpEncounterTableId; die: number; text: string } {
  const { rows } = WFRP_ENCOUNTER_TABLES[id];
  const sides = rows.length;
  const die = 1 + Math.floor(Math.random() * sides);
  return { id, die, text: rows[die - 1] ?? '' };
}
