import {
  characteristicBonus,
  weaponRangeYards,
  woundsFromSize,
  DEFAULT_SIZE,
} from './statblockUtils';
import type {
  ArmourPick,
  ArmourRef,
  CareersRef,
  CharKey,
  EffectiveStats,
  SkillEntry,
  SkillRef,
  Statblock,
  TraitEntry,
  TraitRef,
  WeaponsRef,
} from './types';

export const CHAR_ORDER: CharKey[] = [
  'WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel',
];

export function getCharacteristicValue(
  block: Statblock,
  key: CharKey
): number | undefined {
  const ch = block.characteristics || {};
  const v = ch[key];
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (v && typeof v === 'object' && typeof v.base === 'number') {
    const base = v.base;
    const advances = typeof v.advances === 'number' ? v.advances : 0;
    const addition = typeof v.addition === 'number' ? v.addition : 0;
    return base + advances + addition;
  }
  return undefined;
}

export type NormalisedTrait = { name: string; inputValue: string };

export function normaliseTraits(traits: TraitEntry[] | undefined): NormalisedTrait[] {
  if (!Array.isArray(traits)) return [];
  return traits
    .map((t): NormalisedTrait => {
      if (typeof t === 'string') return { name: t.trim(), inputValue: '' };
      const name = t.name || t.trait || '';
      const inputValue = typeof t.inputValue === 'string' ? t.inputValue : '';
      return { name, inputValue };
    })
    .filter((t) => t.name);
}

/**
 * Effective characteristics, movement, and wounds after trait effects (traits.json effects).
 */
export function computeEffectiveStats(
  block: Statblock,
  traitsRef: TraitRef[] | undefined
): EffectiveStats {
  const traitMap = new Map<string, TraitRef>(
    (Array.isArray(traitsRef) ? traitsRef : []).map((t) => [t.name, t])
  );
  const getChar = (key: CharKey): number => getCharacteristicValue(block, key) ?? 0;

  const effectiveCh: Partial<Record<CharKey, number>> = {};
  CHAR_ORDER.forEach((k) => {
    effectiveCh[k] = getChar(k);
  });

  let movementDelta = 0;
  const woundBonusFromTraits: number[] = [];

  const traitList = normaliseTraits(block.traits);
  traitList.forEach(({ name }) => {
    const ref = traitMap.get(name);
    if (!ref?.effects) return;
    const e = ref.effects;
    if (e.characteristics && typeof e.characteristics === 'object') {
      (Object.entries(e.characteristics) as Array<[string, number | undefined]>).forEach(
        ([charKey, delta]) => {
          if ((CHAR_ORDER as string[]).includes(charKey) && typeof delta === 'number') {
            const k = charKey as CharKey;
            effectiveCh[k] = (effectiveCh[k] ?? 0) + delta;
          }
        }
      );
    }
    if (typeof e.movement === 'number') movementDelta += e.movement;
    if (e.wounds && typeof e.wounds === 'object' && e.wounds.addBonus) {
      const charKey = e.wounds.addBonus;
      if ((CHAR_ORDER as string[]).includes(charKey)) {
        woundBonusFromTraits.push(characteristicBonus(effectiveCh[charKey] ?? 0));
      }
    }
  });

  const getEffectiveChar = (key: CharKey): number => effectiveCh[key] ?? 0;
  const baseWounds = woundsFromSize(block.size, getEffectiveChar);
  const traitWoundBonus = woundBonusFromTraits.reduce((a, b) => a + b, 0);
  const effectiveWounds = baseWounds + traitWoundBonus;

  const baseMovement =
    typeof block.movement === 'number' ? block.movement : Number(block.movement) || 0;
  const effectiveMovement = baseMovement + movementDelta;

  return {
    effectiveCh,
    effectiveMovement: Math.max(0, effectiveMovement),
    effectiveWounds,
  };
}

export function normaliseSkills(
  skills: SkillEntry[] | string[] | undefined
): SkillEntry[] {
  if (!Array.isArray(skills)) return [];
  return skills.map((s): SkillEntry => {
    if (typeof s === 'string') {
      return { name: s, advances: 0 };
    }
    const rec = s as { name?: string; skill?: string; advances?: number };
    const name = rec.name || rec.skill || '';
    const advances = Number.isFinite(rec.advances) ? (rec.advances as number) : 0;
    return { name, advances };
  });
}

export function baseSkillNameForLookup(name: string): string {
  if (typeof name !== 'string') return name;
  const idx = name.indexOf(' (');
  return idx >= 0 ? name.slice(0, idx).trim() : name;
}

export type SkillDisplay = SkillEntry & {
  characteristic?: CharKey;
  total: number;
};

export function buildSkillDisplay(
  block: Statblock,
  skillsRef: SkillRef[] | undefined,
  effectiveCh: Partial<Record<CharKey, number>> | null = null
): SkillDisplay[] {
  const refMap = new Map<string, SkillRef>(
    (Array.isArray(skillsRef) ? skillsRef : []).map((s) => [s.name, s])
  );
  const normalised = normaliseSkills(block.skills);
  const getBase = effectiveCh
    ? (key: CharKey) => effectiveCh[key] ?? 0
    : (key: CharKey) => getCharacteristicValue(block, key) ?? 0;

  const withTotals = normalised
    .filter((s) => s.name)
    .map((s): SkillDisplay => {
      const lookupName = baseSkillNameForLookup(s.name);
      const ref = refMap.get(lookupName) ?? refMap.get(s.name);
      const charKey = ref?.characteristic;
      const base = charKey ? getBase(charKey) : 0;
      const total =
        (typeof base === 'number' ? base : 0) +
        (Number.isFinite(s.advances) ? s.advances : 0);
      return { ...s, characteristic: charKey, total };
    });

  withTotals.sort((a, b) => a.name.localeCompare(b.name));
  return withTotals;
}

export type TraitDisplay = {
  name: string;
  inputValue: string;
  description: string;
};

export function buildTraitsDisplay(
  block: Statblock,
  traitsRef: TraitRef[] | undefined
): TraitDisplay[] {
  const traitList = normaliseTraits(block.traits);
  const map = new Map<string, TraitRef>(
    (Array.isArray(traitsRef) ? traitsRef : []).map((t) => [t.name, t])
  );
  const items = traitList.map(({ name, inputValue }): TraitDisplay => {
    const ref = map.get(name);
    return {
      name,
      inputValue: inputValue || '',
      description: ref?.description || '',
    };
  });
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

export const ARMOUR_LOCATIONS = [
  { roll: '01–09', location: 'Head' },
  { roll: '10–24', location: 'Left Arm' },
  { roll: '25–44', location: 'Right Arm' },
  { roll: '45–79', location: 'Body' },
  { roll: '80–89', location: 'Left Leg' },
  { roll: '90–00', location: 'Right Leg' },
] as const;

function locationToCovered(location: string): string[] {
  if (location === 'Arms') return ['Left Arm', 'Right Arm'];
  if (location === 'Legs') return ['Left Leg', 'Right Leg'];
  return [location];
}

export type ArmourLocationRow = {
  roll: string;
  location: string;
  protection: number;
  breakdown: string;
};

export function buildArmourTable(
  block: Statblock,
  armourRef: ArmourRef | null | undefined,
  effectiveCh: Partial<Record<CharKey, number>> | null | undefined
): ArmourLocationRow[] {
  const armourList: ArmourPick[] = Array.isArray(block.armour)
    ? (block.armour as ArmourPick[])
    : [];
  const categories = armourRef?.armour?.categories || [];
  const itemsByKey = new Map<
    string,
    { name: string; aps?: number; locations?: string[]; category: string }
  >();
  categories.forEach((cat) => {
    (cat.items || []).forEach((item) => {
      itemsByKey.set(`${cat.name}:${item.name}`, { ...item, category: cat.name });
    });
  });
  const selectedItems = armourList
    .map((a) => itemsByKey.get(`${a.category}:${a.name}`))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const TB = characteristicBonus(
    effectiveCh?.T ?? getCharacteristicValue(block, 'T') ?? 0
  );
  const contributorsByLocation: Record<string, Array<{ label: string; aps: number }>> = {};
  ARMOUR_LOCATIONS.forEach(({ location }) => {
    contributorsByLocation[location] = [];
  });
  selectedItems.forEach((item) => {
    (item.locations || []).forEach((loc) => {
      locationToCovered(loc).forEach((l) => {
        if (contributorsByLocation[l] !== undefined) {
          contributorsByLocation[l].push({ label: item.name, aps: item.aps || 0 });
        }
      });
    });
  });
  return ARMOUR_LOCATIONS.map(({ roll, location }) => {
    const armourContributors = contributorsByLocation[location] || [];
    const armourTotal = armourContributors.reduce((sum, c) => sum + c.aps, 0);
    const total = armourTotal + TB;
    const parts = [`TB (${TB})`, ...armourContributors.map((c) => `${c.label} (${c.aps})`)];
    const breakdown = parts.join(' + ');
    return { roll, location, protection: total, breakdown };
  });
}

export type WeaponQualityDisplay = { name: string; description: string };

export type MeleeWeaponDisplay = {
  name: string;
  totalDamage: number;
  reach?: string;
  qualities: WeaponQualityDisplay[];
};

export type RangedWeaponDisplay = {
  name: string;
  ammunition?: string;
  totalDamage: number;
  range: string;
  qualities: WeaponQualityDisplay[];
};

export type WeaponsDisplay = {
  melee: MeleeWeaponDisplay[];
  ranged: RangedWeaponDisplay[];
};

export function buildWeaponsDisplay(
  block: Statblock,
  weaponsRef: WeaponsRef | null | undefined,
  effectiveCh: Partial<Record<CharKey, number>> | null | undefined
): WeaponsDisplay {
  const weapons = block.weapons;
  if (!weaponsRef || typeof weapons !== 'object' || weapons === null) {
    return { melee: [], ranged: [] };
  }
  const qfMap = new Map<string, string>(
    (weaponsRef.qualitiesAndFlaws || []).map((q) => [q.name, q.description || ''])
  );
  const getSB = () =>
    characteristicBonus(effectiveCh?.S ?? getCharacteristicValue(block, 'S') ?? 0);

  const meleeCats = weaponsRef.melee?.categories || [];
  type MeleeItem = NonNullable<(typeof meleeCats)[number]['weapons']>[number] & {
    category: string;
  };
  const meleeByKey = new Map<string, MeleeItem>();
  meleeCats.forEach((cat) => {
    (cat.weapons || []).forEach((w) =>
      meleeByKey.set(`${cat.name}:${w.name}`, { ...w, category: cat.name })
    );
  });
  const rangedCats = weaponsRef.ranged?.categories || [];
  type RangedItem = NonNullable<(typeof rangedCats)[number]['weapons']>[number] & {
    category: string;
  };
  const rangedByKey = new Map<string, RangedItem>();
  rangedCats.forEach((cat) => {
    (cat.weapons || []).forEach((w) =>
      rangedByKey.set(`${cat.name}:${w.name}`, { ...w, category: cat.name })
    );
  });
  const ammoCats = weaponsRef.ammunition?.categories || [];
  type AmmoItem = NonNullable<(typeof ammoCats)[number]['ammunition']>[number] & {
    category: string;
  };
  const ammoByKey = new Map<string, AmmoItem>();
  ammoCats.forEach((cat) => {
    (cat.ammunition || []).forEach((a) =>
      ammoByKey.set(`${cat.name}:${a.name}`, { ...a, category: cat.name })
    );
  });

  const meleePicks = Array.isArray(weapons.melee) ? weapons.melee : [];
  const meleeList = meleePicks
    .map((sel): MeleeWeaponDisplay | null => {
      const w = meleeByKey.get(`${sel.category}:${sel.name}`);
      if (!w) return null;
      const totalDamage = (w.damage || 0) + (w.sbDamage ? getSB() : 0);
      const qualities = (w.qualitiesAndFlaws || []).map((name) => ({
        name,
        description: qfMap.get(name) || '',
      }));
      return { name: w.name, totalDamage, reach: w.reach, qualities };
    })
    .filter((x): x is MeleeWeaponDisplay => x !== null);

  const rangedPicks = Array.isArray(weapons.ranged) ? weapons.ranged : [];
  const rangedList = rangedPicks
    .map((sel): RangedWeaponDisplay | null => {
      const w = rangedByKey.get(`${sel.category}:${sel.name}`);
      const ammo = sel.ammunition
        ? ammoByKey.get(`${sel.category}:${sel.ammunition}`)
        : null;
      if (!w) return null;
      const sb = getSB();
      const weaponRange = weaponRangeYards(w, sb);
      const totalRange =
        ammo != null ? weaponRange + (Number(ammo.range) || 0) : weaponRange;
      let totalDamage = (w.damage || 0) + (w.sbDamage ? sb : 0);
      if (ammo) totalDamage += ammo.damage || 0;
      const qNames = [
        ...new Set<string>([
          ...(w.qualitiesAndFlaws || []),
          ...(ammo?.qualitiesAndFlaws || []),
        ]),
      ];
      const qualities = qNames.map((name) => ({
        name,
        description: qfMap.get(name) || '',
      }));
      const rangeText =
        ammo != null
          ? `${weaponRange} + ${ammo.range ?? 0} = ${totalRange}`
          : String(weaponRange);
      return { name: w.name, ammunition: ammo?.name, totalDamage, range: rangeText, qualities };
    })
    .filter((x): x is RangedWeaponDisplay => x !== null);

  return { melee: meleeList, ranged: rangedList };
}

export type ArmourListRow = {
  name: string;
  aps: number | undefined;
  qualities: WeaponQualityDisplay[];
};

export function buildArmourListDisplay(
  block: Statblock,
  armourRef: ArmourRef | null | undefined
): ArmourListRow[] {
  const armourList: ArmourPick[] = Array.isArray(block.armour)
    ? (block.armour as ArmourPick[])
    : [];
  const categories = armourRef?.armour?.categories || [];
  const qfMap = new Map<string, string>(
    (armourRef?.qualitiesAndFlaws || []).map((q) => [q.name, q.description || ''])
  );
  const itemsByKey = new Map<
    string,
    {
      name: string;
      aps?: number;
      qualitiesAndFlaws?: string[];
      category: string;
    }
  >();
  categories.forEach((cat) => {
    (cat.items || []).forEach((item) => {
      itemsByKey.set(`${cat.name}:${item.name}`, { ...item, category: cat.name });
    });
  });
  return armourList
    .map((a) => itemsByKey.get(`${a.category}:${a.name}`))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({
      name: item.name,
      aps: item.aps,
      qualities: (item.qualitiesAndFlaws || []).map((name) => ({
        name,
        description: qfMap.get(name) || '',
      })),
    }));
}

export function computeHighestStatus(
  block: Statblock,
  careersRef: CareersRef | null | undefined
): string | null {
  if (!careersRef || !Array.isArray(careersRef.classes) || !Array.isArray(block.careers)) {
    return null;
  }
  const tierOrder: Record<string, number> = { Brass: 0, Silver: 1, Gold: 2 };
  let best: string | null = null;
  let bestScore = -1;
  block.careers.forEach((c) => {
    const className = c.className || c.class;
    const careerName = c.careerName || c.career;
    const level = c.level || 1;
    const cls = careersRef.classes!.find((cl) => cl.name === className);
    if (!cls) return;
    const career = Array.isArray(cls.careers)
      ? cls.careers.find((cr) => cr.name === careerName)
      : null;
    if (!career || !Array.isArray(career.levels)) return;
    const lvl =
      career.levels.find((lv) => lv.level === level) ||
      career.levels[career.levels.length - 1];
    if (!lvl || !lvl.status) return;
    const [tier, numStr] = lvl.status.split(' ');
    const tierRank = tier ? (tierOrder[tier] ?? -1) : -1;
    const num = Number(numStr) || 0;
    const score = tierRank * 10 + num;
    if (score > bestScore) {
      bestScore = score;
      best = lvl.status;
    }
  });
  return best;
}

export function buildCareerLevelLabels(
  block: Statblock,
  careersRef: CareersRef | null | undefined
): string[] {
  if (!careersRef || !Array.isArray(careersRef.classes) || !Array.isArray(block.careers)) {
    return [];
  }
  const labels: string[] = [];
  block.careers.forEach((c) => {
    const className = c.className || c.class;
    const careerName = c.careerName || c.career;
    const level = c.level || 1;
    const cls = careersRef.classes!.find((cl) => cl.name === className);
    if (!cls) return;
    const career = Array.isArray(cls.careers)
      ? cls.careers.find((cr) => cr.name === careerName)
      : null;
    if (!career || !Array.isArray(career.levels)) return;
    const lvl =
      career.levels.find((lv) => lv.level === level) ||
      career.levels[career.levels.length - 1];
    if (!lvl) return;
    labels.push(`${career.name}: ${lvl.name}`);
  });
  return labels;
}

export { DEFAULT_SIZE };
