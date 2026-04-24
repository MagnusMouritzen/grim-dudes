export type CharKey = 'WS' | 'BS' | 'S' | 'T' | 'I' | 'Ag' | 'Dex' | 'Int' | 'WP' | 'Fel';

export type CharacteristicAdvanced = {
  base: number;
  advances?: number;
  addition?: number;
};

export type Characteristic = number | CharacteristicAdvanced | string;

export type Size =
  | 'Tiny'
  | 'Little'
  | 'Small'
  | 'Average'
  | 'Large'
  | 'Enormous'
  | 'Monstrous';

export type SkillEntry = { name: string; advances: number };

export type TraitEntryObject = { name: string; inputValue?: string; trait?: string };
export type TraitEntry = string | TraitEntryObject;

export type CareerEntry = {
  className?: string;
  careerName?: string;
  class?: string;
  career?: string;
  level?: number;
};

export type WeaponPick = { category: string; name: string; ammunition?: string };

export type ArmourPick = { category: string; name: string };

export type WeaponsShape =
  | string
  | {
      melee?: WeaponPick[];
      ranged?: WeaponPick[];
    };

export type ArmourShape = string | ArmourPick[];

export type Statblock = {
  id?: string;
  name?: string;
  templateId?: string;
  randomiseCharacteristics?: boolean;
  characteristics?: Partial<Record<CharKey, Characteristic>>;
  size?: Size | string;
  wounds?: number;
  movement?: number;
  skills?: SkillEntry[];
  talents?: string[];
  traits?: TraitEntry[];
  tags?: string[];
  careers?: CareerEntry[];
  weapons?: WeaponsShape;
  armour?: ArmourShape;
  notes?: string;
  [key: string]: unknown;
};

export type SkillRef = {
  name: string;
  characteristic?: CharKey;
  description?: string;
};

export type TraitRef = {
  name: string;
  description?: string;
  generic?: boolean;
  input?: boolean | string;
  effects?: {
    characteristics?: Partial<Record<CharKey, number>>;
    movement?: number;
    wounds?: { addBonus?: CharKey };
  };
};

export type QualityRef = { name: string; description?: string };

export type MeleeWeaponRef = {
  name: string;
  damage?: number;
  sbDamage?: boolean;
  reach?: string;
  qualitiesAndFlaws?: string[];
};

export type RangedWeaponRef = {
  name: string;
  damage?: number;
  sbDamage?: boolean;
  range?: number;
  rangeSbMultiplier?: number;
  qualitiesAndFlaws?: string[];
};

export type AmmunitionRef = {
  name: string;
  damage?: number;
  range?: number;
  qualitiesAndFlaws?: string[];
};

export type WeaponsRef = {
  qualitiesAndFlaws?: QualityRef[];
  melee?: { categories?: Array<{ name: string; weapons?: MeleeWeaponRef[] }> };
  ranged?: { categories?: Array<{ name: string; weapons?: RangedWeaponRef[] }> };
  ammunition?: {
    categories?: Array<{ name: string; ammunition?: AmmunitionRef[] }>;
  };
};

export type ArmourItemRef = {
  name: string;
  aps?: number;
  locations?: string[];
  qualitiesAndFlaws?: string[];
};

export type ArmourRef = {
  qualitiesAndFlaws?: QualityRef[];
  armour?: { categories?: Array<{ name: string; items?: ArmourItemRef[] }> };
};

export type CareerLevel = {
  level: number;
  name: string;
  status?: string;
  skills?: string[];
  characteristics?: CharKey[];
};

export type CareerDef = {
  name: string;
  levels: CareerLevel[];
};

export type CareerClass = {
  name: string;
  careers: CareerDef[];
};

export type CareersRef = { classes?: CareerClass[] };

export type Template = {
  id?: string;
  name?: string;
  characteristics?: Partial<Record<CharKey, number>>;
  skills?: SkillEntry[];
  traits?:
    | TraitEntry[]
    | {
        base?: TraitEntry[];
        optional?: TraitEntry[];
      };
  talents?: string[];
  size?: Size | string;
  movement?: number;
  [key: string]: unknown;
};

export type EffectiveStats = {
  effectiveCh: Partial<Record<CharKey, number>>;
  effectiveMovement: number;
  effectiveWounds: number;
};
