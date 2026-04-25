'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { SIZES, DEFAULT_SIZE } from '@/lib/statblockUtils';
import { computeEffectiveStats } from '@/lib/statblockDerived';
import { useGrimMotion } from '@/lib/useMotion';
import { saveStatblockAction } from '@/app-actions/statblocks';
import dynamic from 'next/dynamic';

const EditorModals = dynamic(() => import('./editor/EditorModals'), { ssr: false });
import {
  armourRefSchema,
  careersRefSchema,
  safeParse,
  skillRefSchema,
  templateSchema,
  templatesArraySchema,
  traitRefSchema,
  weaponsRefSchema,
} from '@/lib/apiSchemas';
import { statblockBodySchemaBase } from '@/lib/validateStatblock';
import { postDuplicateStatblock } from '@/lib/duplicateStatblockClient';
import { z } from 'zod';
import {
  ChevronIcon,
  DiceIcon,
  PlusIcon,
  ScrollIcon,
  SwordsIcon,
} from './icons';
import type {
  ArmourPick,
  ArmourRef,
  CareerClass,
  CareerEntry,
  CareersRef,
  CharKey,
  SkillEntry,
  SkillRef,
  Statblock,
  Template,
  TraitEntry,
  TraitRef,
  WeaponPick,
  WeaponsRef,
} from '@/lib/types';

const API = '/api';
const CHAR_ORDER: CharKey[] = ['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'];

type CharMap<T> = Record<CharKey, T>;

type FormState = {
  name: string;
  characteristics: CharMap<string>;
  size: string;
  movement: string;
  talents: string;
  tags: string;
  notes: string;
  playerNotes: string;
};

type NonTemplatePending = { routeId: string; data: Statblock } | null;

function roll2d10(): number {
  return (1 + Math.floor(Math.random() * 10)) + (1 + Math.floor(Math.random() * 10));
}

const emptyCharacteristics: CharMap<string> = Object.fromEntries(
  CHAR_ORDER.map((k) => [k, ''])
) as CharMap<string>;
const zeroAdvances: CharMap<number> = Object.fromEntries(
  CHAR_ORDER.map((k) => [k, 0])
) as CharMap<number>;
const defaultAdditions: CharMap<number> = Object.fromEntries(
  CHAR_ORDER.map((k) => [k, 10])
) as CharMap<number>;

type CareerSelection = {
  className: string;
  careerName: string;
  level: number;
};

function computeCareerEffectsFrom(
  classes: CareerClass[],
  careersArray: CareerSelection[]
): { careerSkillAdv: Map<string, number>; careerCharAdv: Map<CharKey, number> } {
  const careerSkillAdv = new Map<string, number>();
  const careerCharAdv = new Map<CharKey, number>();
  (Array.isArray(careersArray) ? careersArray : []).forEach((sel) => {
    const cls = (Array.isArray(classes) ? classes : []).find((c) => c.name === sel.className);
    if (!cls) return;
    const career = Array.isArray(cls.careers)
      ? cls.careers.find((c) => c.name === sel.careerName)
      : null;
    if (!career || !Array.isArray(career.levels)) return;
    const chosen = Math.max(1, Math.min(4, sel.level || 1));
    career.levels.forEach((lvl) => {
      const lvlIndex = lvl.level || 1;
      if (lvlIndex > chosen) return;
      const steps = chosen - lvlIndex + 1;
      const bonus = 5 * steps;
      (lvl.skills || []).forEach((skillName) => {
        if (!skillName) return;
        const prev = careerSkillAdv.get(skillName) || 0;
        if (bonus > prev) careerSkillAdv.set(skillName, bonus);
      });
      (lvl.characteristics || []).forEach((charKey) => {
        if (!charKey) return;
        const prev = careerCharAdv.get(charKey) || 0;
        if (bonus > prev) careerCharAdv.set(charKey, bonus);
      });
    });
  });
  return { careerSkillAdv, careerCharAdv };
}

function focusFirst(container: HTMLElement | null): void {
  if (!container) return;
  const selectors =
    'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusable = container.querySelectorAll<HTMLElement>(selectors);
  (focusable[0] ?? container).focus();
}

const emptyWeaponsRef: WeaponsRef = {
  qualitiesAndFlaws: [],
  melee: { categories: [] },
  ranged: { categories: [] },
  ammunition: { categories: [] },
};

const emptyArmourRef: ArmourRef = {
  qualitiesAndFlaws: [],
  armour: { categories: [] },
};

function templateCharValue(tpl: Template | null, key: CharKey): number {
  if (!tpl || !tpl.characteristics) return 0;
  const v = tpl.characteristics[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function templateTraitGroups(tpl: Template | null): {
  base: TraitEntry[];
  optional: TraitEntry[];
} {
  if (!tpl) return { base: [], optional: [] };
  const t = tpl.traits;
  if (!t) return { base: [], optional: [] };
  if (Array.isArray(t)) return { base: t, optional: [] };
  return {
    base: Array.isArray(t.base) ? t.base : [],
    optional: Array.isArray(t.optional) ? t.optional : [],
  };
}

export default function StatBlockEditor() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const { ease } = useGrimMotion();
  const [rerollKey, setRerollKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dupBusy, setDupBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const markDirty = useCallback(() => setDirty(true), []);
  const templateModalRef = useRef<HTMLDivElement | null>(null);
  const careerModalRef = useRef<HTMLDivElement | null>(null);
  const templateButtonRef = useRef<HTMLButtonElement | null>(null);
  const careerButtonRef = useRef<HTMLButtonElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allSkills, setAllSkills] = useState<SkillRef[]>([]);
  const [allTraits, setAllTraits] = useState<TraitRef[]>([]);
  const [allCareers, setAllCareers] = useState<CareersRef>({ classes: [] });
  const [templatesList, setTemplatesList] = useState<Template[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<SkillEntry[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<TraitEntry[]>([]);
  const [characteristicAdvances, setCharacteristicAdvances] = useState<CharMap<number>>({
    ...zeroAdvances,
  });
  const [characteristicAdditions, setCharacteristicAdditions] = useState<CharMap<number>>({
    ...defaultAdditions,
  });
  const [randomiseCharacteristics, setRandomiseCharacteristics] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '',
    characteristics: { ...emptyCharacteristics },
    size: DEFAULT_SIZE,
    movement: '',
    talents: '',
    tags: '',
    notes: '',
    playerNotes: '',
  });
  const [weaponsRef, setWeaponsRef] = useState<WeaponsRef>(emptyWeaponsRef);
  const [armourRef, setArmourRef] = useState<ArmourRef>(emptyArmourRef);
  const [selectedMeleeWeapons, setSelectedMeleeWeapons] = useState<WeaponPick[]>([]);
  const [selectedRangedWeapons, setSelectedRangedWeapons] = useState<WeaponPick[]>([]);
  const [selectedArmour, setSelectedArmour] = useState<ArmourPick[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<CareerSelection[]>([]);
  const baseCharacteristicRef = useRef<Partial<CharMap<number>>>({});
  const pendingNonTemplateRef = useRef<NonTemplatePending>(null);
  const userChangedCareersRef = useRef(false);
  const [skillFilter, setSkillFilter] = useState('');
  const [skillsGroupByCharacteristic, setSkillsGroupByCharacteristic] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    markDirty();
  };

  const updateChar = (key: CharKey, value: string) => {
    setForm((prev) => ({
      ...prev,
      characteristics: { ...prev.characteristics, [key]: value },
    }));
    markDirty();
  };

  // Warn on tab close / refresh when there are unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // Keyboard: Cmd/Ctrl+S saves, Escape closes open modals.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSaveRef.current?.();
      } else if (e.key === 'Escape') {
        if (templateModalOpen) setTemplateModalOpen(false);
        if (careerModalOpen) setCareerModalOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [templateModalOpen, careerModalOpen]);

  // Return focus to the opener when a modal closes; focus first focusable inside on open.
  useEffect(() => {
    if (templateModalOpen) {
      focusFirst(templateModalRef.current);
    } else {
      templateButtonRef.current?.focus();
    }
  }, [templateModalOpen]);
  useEffect(() => {
    if (careerModalOpen) {
      focusFirst(careerModalRef.current);
    } else {
      careerButtonRef.current?.focus();
    }
  }, [careerModalOpen]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/skills`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API}/traits`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API}/templates`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API}/weapons`).then((r) => (r.ok ? r.json() : { qualitiesAndFlaws: [], melee: { categories: [] }, ranged: { categories: [] }, ammunition: { categories: [] } })),
      fetch(`${API}/armour`).then((r) => (r.ok ? r.json() : { qualitiesAndFlaws: [], armour: { categories: [] } })),
      fetch(`${API}/careers`).then((r) => (r.ok ? r.json() : { classes: [] })),
    ])
      .then(([skills, traits, templates, weapons, armour, careers]) => {
        const skillArr =
          (safeParse(z.array(skillRefSchema), skills) as SkillRef[] | null) ?? [];
        const traitArr =
          (safeParse(z.array(traitRefSchema), traits) as TraitRef[] | null) ?? [];
        const templateArr =
          (safeParse(templatesArraySchema, templates) as Template[] | null) ?? [];
        setAllSkills([...skillArr].sort((a, b) => a.name.localeCompare(b.name)));
        setAllTraits([...traitArr].sort((a, b) => a.name.localeCompare(b.name)));
        setTemplatesList(
          [...templateArr].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        );
        setWeaponsRef(
          (safeParse(weaponsRefSchema, weapons) as WeaponsRef | null) ?? emptyWeaponsRef
        );
        setArmourRef(
          (safeParse(armourRefSchema, armour) as ArmourRef | null) ?? emptyArmourRef
        );
        setAllCareers(
          (safeParse(careersRefSchema, careers) as CareersRef | null) ?? { classes: [] }
        );
      })
      .catch(() => {
        // fail silently; editor will still work without reference data
      });
  }, []);

  // When the user changes careers (add/remove/level), recalculate skills and characteristics from current careers only
  useEffect(() => {
    if (!userChangedCareersRef.current) return;
    userChangedCareersRef.current = false;
    const classes = Array.isArray(allCareers.classes) ? allCareers.classes : [];
    const { careerSkillAdv, careerCharAdv } = computeCareerEffectsFrom(classes, selectedCareers);

    setSelectedSkills(
      Array.from(careerSkillAdv.entries())
        .map(([name, advances]): SkillEntry => ({ name, advances }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );

    if (template) {
      setCharacteristicAdvances(
        Object.fromEntries(CHAR_ORDER.map((k) => [k, careerCharAdv.get(k) ?? 0])) as CharMap<number>
      );
    } else {
      const base = baseCharacteristicRef.current;
      setForm((f) => {
        const nextCh: CharMap<string> = { ...f.characteristics };
        CHAR_ORDER.forEach((k) => {
          const baseVal = base[k] ?? 0;
          const careerVal = careerCharAdv.get(k) ?? 0;
          const total = baseVal + careerVal;
          nextCh[k] = total === 0 ? '' : String(total);
        });
        return { ...f, characteristics: nextCh };
      });
    }
  }, [selectedCareers, allCareers, template]);

  useEffect(() => {
    if (!id) {
      baseCharacteristicRef.current = {};
      pendingNonTemplateRef.current = null;
      return;
    }
    pendingNonTemplateRef.current = null;
    fetch(`${API}/statblocks/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then((raw: unknown) => {
        const parsed = safeParse(statblockBodySchemaBase.passthrough(), raw);
        const data = (parsed as Statblock | null) ?? ({} as Statblock);
        setExistingId(typeof data.id === 'string' ? data.id : null);
        const chars = data.characteristics || {};
        const wsVal = chars.WS;
        const isTemplateBased =
          Boolean(data.templateId) && wsVal != null && typeof wsVal === 'object';
        if (isTemplateBased && data.templateId) {
          pendingNonTemplateRef.current = null;
          fetch(`${API}/templates/${encodeURIComponent(data.templateId)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((rawTpl: unknown) => {
              const tpl = safeParse(templateSchema, rawTpl) as Template | null;
              if (tpl) setTemplate(tpl);
              const advances: CharMap<number> = { ...zeroAdvances };
              const additions: CharMap<number> = { ...defaultAdditions };
              CHAR_ORDER.forEach((k) => {
                const v = chars[k];
                if (v && typeof v === 'object') {
                  if (typeof v.advances === 'number') advances[k] = v.advances;
                  if (typeof v.addition === 'number') additions[k] = v.addition;
                }
              });
              setCharacteristicAdvances(advances);
              setCharacteristicAdditions(additions);
              setRandomiseCharacteristics(!!data.randomiseCharacteristics);
            });
        } else {
          setTemplate(null);
          setCharacteristicAdvances({ ...zeroAdvances });
          setCharacteristicAdditions({ ...defaultAdditions });
          setRandomiseCharacteristics(false);
          pendingNonTemplateRef.current = { routeId: id, data };
        }
        const flatChars: CharMap<string> = { ...emptyCharacteristics };
        if (typeof wsVal === 'number') {
          CHAR_ORDER.forEach((k) => {
            const v = chars[k];
            if (typeof v === 'number') flatChars[k] = String(v);
          });
        }
        setForm((prev) => ({
          ...prev,
          name: data.name || '',
          characteristics: flatChars,
          size: data.size || DEFAULT_SIZE,
          movement: data.movement != null ? String(data.movement) : '',
          talents: Array.isArray(data.talents) ? data.talents.join(', ') : '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
          notes: typeof data.notes === 'string' ? data.notes : '',
          playerNotes: typeof (data as { playerNotes?: string }).playerNotes === 'string' ? (data as { playerNotes: string }).playerNotes : '',
        }));
        const weaponsObj =
          data.weapons && typeof data.weapons === 'object' ? data.weapons : null;
        const melee = weaponsObj && Array.isArray(weaponsObj.melee) ? weaponsObj.melee : [];
        const ranged = weaponsObj && Array.isArray(weaponsObj.ranged) ? weaponsObj.ranged : [];
        setSelectedMeleeWeapons(
          melee.map((w) => ({ category: w.category || '', name: w.name || '' })).filter((w) => w.name)
        );
        setSelectedRangedWeapons(
          ranged
            .map((w) => ({
              category: w.category || '',
              name: w.name || '',
              ammunition: w.ammunition || '',
            }))
            .filter((w) => w.name)
        );
        setSelectedArmour(
          Array.isArray(data.armour)
            ? (data.armour as ArmourPick[])
                .map((a) => ({ category: a.category || '', name: a.name || '' }))
                .filter((a) => a.name)
            : []
        );
        setSelectedCareers(
          Array.isArray(data.careers)
            ? (data.careers as CareerEntry[])
                .map((c) => ({
                  className: c.className || c.class || '',
                  careerName: c.careerName || c.career || '',
                  level: c.level || 1,
                }))
                .filter((c) => c.careerName)
            : []
        );
        const rawSkills = Array.isArray(data.skills) ? data.skills : [];
        const normalisedSkills: SkillEntry[] = rawSkills.map((s): SkillEntry => {
          if (typeof s === 'string') return { name: s, advances: 0 };
          const rec = s as { name?: string; skill?: string; advances?: number };
          const name = rec.name || rec.skill || '';
          const advances = Number.isFinite(rec.advances) ? (rec.advances as number) : 0;
          return { name, advances };
        });
        setSelectedSkills(normalisedSkills);
        const rawTraits = Array.isArray(data.traits) ? data.traits : [];
        const normalisedTraits: TraitEntry[] = rawTraits
          .map((t): TraitEntry => {
            if (typeof t === 'string') return { name: t, inputValue: '' };
            const rec = t as { name?: string; trait?: string; inputValue?: string };
            return {
              name: rec.name || rec.trait || '',
              inputValue: typeof rec.inputValue === 'string' ? rec.inputValue : '',
            };
          })
          .filter((t) => (typeof t === 'string' ? t.length > 0 : Boolean(t.name)));
        setSelectedTraits(normalisedTraits);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const pending = pendingNonTemplateRef.current;
    if (!pending || pending.routeId !== id) return;
    const data = pending.data;
    const wsVal = data.characteristics?.WS;
    if (data.templateId && wsVal != null && typeof wsVal === 'object') return;
    const classes = Array.isArray(allCareers.classes) ? allCareers.classes : [];
    const careersFromData: CareerSelection[] = Array.isArray(data.careers)
      ? (data.careers as CareerEntry[])
          .map((c) => ({
            className: c.className || c.class || '',
            careerName: c.careerName || c.career || '',
            level: c.level || 1,
          }))
          .filter((c) => c.careerName)
      : [];
    const { careerCharAdv } = computeCareerEffectsFrom(classes, careersFromData);
    baseCharacteristicRef.current = CHAR_ORDER.reduce<Partial<CharMap<number>>>((acc, k) => {
      const v = data.characteristics?.[k];
      const num = typeof v === 'number' && Number.isFinite(v) ? v : 0;
      acc[k] = num - (careerCharAdv.get(k) ?? 0);
      return acc;
    }, {});
  }, [id, allCareers]);

  const applyTemplate = (tpl: Template) => {
    setTemplate(tpl);
    setTemplateModalOpen(false);
    setForm((prev) => ({
      ...prev,
      name: prev.name || tpl.name || '',
      size: tpl.size || DEFAULT_SIZE,
      movement: tpl.movement != null ? String(tpl.movement) : '',
      talents: Array.isArray(tpl.talents) ? tpl.talents.join(', ') : '',
      tags: '',
    }));
    setCharacteristicAdvances({ ...zeroAdvances });
    setCharacteristicAdditions({ ...defaultAdditions });
    setRandomiseCharacteristics(false);
    setSelectedMeleeWeapons([]);
    setSelectedRangedWeapons([]);
    setSelectedArmour([]);
    setSelectedCareers([]);
    userChangedCareersRef.current = true;
    const base = templateTraitGroups(tpl).base;
    const baseTraits: Array<{ name: string; inputValue: string }> = base
      .map((t) => {
        if (typeof t === 'string') return { name: t, inputValue: '' };
        const rec = t as { name?: string; trait?: string; inputValue?: string };
        return {
          name: rec.name || rec.trait || '',
          inputValue: typeof rec.inputValue === 'string' ? rec.inputValue : '',
        };
      })
      .filter((t) => t.name)
      .sort((a, b) => a.name.localeCompare(b.name));
    setSelectedTraits(baseTraits);
    setSelectedSkills([]);
  };

  const clearTemplate = () => {
    setTemplate(null);
    setCharacteristicAdvances({ ...zeroAdvances });
    setCharacteristicAdditions({ ...defaultAdditions });
    setRandomiseCharacteristics(false);
    setForm((prev) => ({ ...prev, characteristics: { ...emptyCharacteristics }, tags: '' }));
  };

  const setRandomise = (on: boolean) => {
    setRandomiseCharacteristics(on);
    if (on) {
      const next = { ...zeroAdvances };
      CHAR_ORDER.forEach((k) => {
        next[k] = roll2d10();
      });
      setCharacteristicAdditions(next);
    } else {
      setCharacteristicAdditions({ ...defaultAdditions });
    }
  };

  const rerollCharacteristics = () => {
    const next = { ...zeroAdvances };
    CHAR_ORDER.forEach((k) => {
      next[k] = roll2d10();
    });
    setCharacteristicAdditions(next);
    setRerollKey((k) => k + 1);
  };

  const updateCharAdvance = (key: CharKey, value: string) => {
    setCharacteristicAdvances((prev) => ({
      ...prev,
      [key]: value === '' ? 0 : Number(value) || 0,
    }));
  };

  const addSkill = (name: string) => {
    setSelectedSkills((prev) => {
      if (prev.some((s) => s.name === name)) return prev;
      return [...prev, { name, advances: 0 }];
    });
  };

  const removeSkill = (name: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s.name !== name));
  };

  const updateSkillAdvances = (name: string, value: string) => {
    setSelectedSkills((prev) =>
      prev.map((s) =>
        s.name === name ? { ...s, advances: value === '' ? 0 : Number(value) || 0 } : s
      )
    );
  };

  const traitName = (t: TraitEntry): string => (typeof t === 'string' ? t : t.name);

  const addTrait = (name: string, defaultInputValue = '') => {
    setSelectedTraits((prev) => {
      if (prev.some((t) => traitName(t) === name)) return prev;
      const next: TraitEntry[] = [...prev, { name, inputValue: defaultInputValue }];
      return next.sort((a, b) => traitName(a).localeCompare(traitName(b)));
    });
  };

  const toggleTraitOnBlock = (name: string) => {
    setSelectedTraits((prev) => prev.filter((t) => traitName(t) !== name));
  };

  const updateTraitInputValue = (name: string, value: string) => {
    setSelectedTraits((prev) =>
      prev.map((t): TraitEntry => {
        if (traitName(t) !== name) return t;
        return typeof t === 'object'
          ? { ...t, inputValue: value }
          : { name: t, inputValue: value };
      })
    );
  };

  const getSelectedTraitEntry = (name: string): { name: string; inputValue: string } => {
    const t = selectedTraits.find((x) => traitName(x) === name);
    if (t == null) return { name, inputValue: '' };
    if (typeof t === 'string') return { name: t, inputValue: '' };
    return { name: t.name, inputValue: typeof t.inputValue === 'string' ? t.inputValue : '' };
  };

  const previewTraitsForDerived = useMemo<TraitEntry[]>(
    () =>
      selectedTraits.map((t): TraitEntry => {
        const name = traitName(t);
        const inputValue =
          typeof t === 'object' && t != null && typeof t.inputValue === 'string'
            ? t.inputValue
            : undefined;
        return inputValue ? { name, inputValue } : { name };
      }),
    [selectedTraits]
  );

  const previewBlockForDerived = useMemo<Statblock>(() => {
    const characteristics: Partial<Record<CharKey, number | { base: number; advances: number; addition: number }>> = {};
    if (template) {
      CHAR_ORDER.forEach((k) => {
        const base = templateCharValue(template, k);
        characteristics[k] = {
          base,
          advances: characteristicAdvances[k] ?? 0,
          addition: characteristicAdditions[k] ?? 10,
        };
      });
    } else {
      CHAR_ORDER.forEach((k) => {
        const v = form.characteristics[k];
        const n = Number(v);
        if (v !== '' && v != null && Number.isFinite(n)) characteristics[k] = n;
      });
    }
    const movRaw = form.movement;
    const movement = movRaw === '' || movRaw == null ? 0 : Number(movRaw);
    return {
      characteristics,
      size: form.size || DEFAULT_SIZE,
      movement: Number.isFinite(movement) ? movement : 0,
      traits: previewTraitsForDerived,
    };
  }, [
    template,
    form.characteristics,
    form.size,
    form.movement,
    characteristicAdvances,
    characteristicAdditions,
    previewTraitsForDerived,
  ]);

  const { effectiveWounds: computedWounds } = computeEffectiveStats(
    previewBlockForDerived,
    allTraits
  );

  type SkillPicker =
    | { grouped: Record<string, SkillRef[]>; flat: null }
    | { grouped: null; flat: SkillRef[] };

  const filteredSkillsForPicker = useMemo<SkillPicker>(() => {
    const q = skillFilter.trim().toLowerCase();
    let list = allSkills;
    if (q) list = list.filter((s) => (s.name || '').toLowerCase().includes(q));
    if (skillsGroupByCharacteristic) {
      const byChar: Record<string, SkillRef[]> = {};
      for (const s of list) {
        const c = s.characteristic || '—';
        if (!byChar[c]) byChar[c] = [];
        byChar[c].push(s);
      }
      Object.keys(byChar).forEach((k) => {
        byChar[k]?.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });
      return { grouped: byChar, flat: null };
    }
    return { grouped: null, flat: list };
  }, [allSkills, skillFilter, skillsGroupByCharacteristic]);

  const toPayload = (): Record<string, unknown> => {
    const num = (v: string): number | undefined =>
      v === '' || v == null ? undefined : Number(v);
    const tags = form.tags
      ? form.tags.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const talents = form.talents
      ? form.talents.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const traitsPayload = selectedTraits.map((t) => {
      const name = traitName(t);
      const inputValue =
        typeof t === 'object' && t != null && typeof t.inputValue === 'string'
          ? t.inputValue
          : undefined;
      return inputValue ? { name, inputValue } : { name };
    });
    const skillsPayload = selectedSkills
      .filter((s) => s.name)
      .map((s) => ({ name: s.name, advances: Number.isFinite(s.advances) ? s.advances : 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const careersPayload = selectedCareers.length
      ? selectedCareers.map((c) => ({
          className: c.className,
          careerName: c.careerName,
          level: c.level || 1,
        }))
      : undefined;
    const notesTrim = form.notes.trim();
    const playerNotesTrim = form.playerNotes.trim();
    if (template) {
      const characteristics: Record<string, { base: number; advances: number; addition: number }> = {};
      CHAR_ORDER.forEach((k) => {
        const base = templateCharValue(template, k);
        characteristics[k] = {
          base,
          advances: characteristicAdvances[k] ?? 0,
          addition: characteristicAdditions[k] ?? 10,
        };
      });
      return {
        id: existingId || undefined,
        name: form.name || 'Unnamed',
        templateId: template.id,
        randomiseCharacteristics: randomiseCharacteristics,
        characteristics,
        size: form.size || DEFAULT_SIZE,
        wounds: computedWounds,
        movement: num(form.movement),
        skills: skillsPayload.length ? skillsPayload : undefined,
        talents: talents.length ? talents : undefined,
        traits: traitsPayload.length ? traitsPayload : undefined,
        careers: careersPayload,
        tags: tags.length ? tags : undefined,
        notes: notesTrim || undefined,
        playerNotes: playerNotesTrim || undefined,
        weapons:
          selectedMeleeWeapons.length > 0 || selectedRangedWeapons.length > 0
            ? { melee: selectedMeleeWeapons, ranged: selectedRangedWeapons }
            : undefined,
        armour: selectedArmour.length > 0 ? selectedArmour : undefined,
      };
    }
    const characteristics: Partial<Record<CharKey, number>> = {};
    CHAR_ORDER.forEach((k) => {
      const v = form.characteristics[k];
      const n = v !== '' && v != null ? num(v) : undefined;
      if (n !== undefined && Number.isFinite(n)) characteristics[k] = n;
    });
    return {
      id: existingId || undefined,
      name: form.name || 'Unnamed',
      characteristics: Object.keys(characteristics).length ? characteristics : undefined,
      size: form.size || DEFAULT_SIZE,
      wounds: computedWounds,
      movement: num(form.movement),
      skills: skillsPayload.length ? skillsPayload : undefined,
      talents: talents.length ? talents : undefined,
      traits: traitsPayload.length ? traitsPayload : undefined,
      careers: careersPayload,
      tags: tags.length ? tags : undefined,
      notes: notesTrim || undefined,
      playerNotes: playerNotesTrim || undefined,
      weapons:
        selectedMeleeWeapons.length > 0 || selectedRangedWeapons.length > 0
          ? { melee: selectedMeleeWeapons, ranged: selectedRangedWeapons }
          : undefined,
      armour: selectedArmour.length > 0 ? selectedArmour : undefined,
    };
  };

  const handleSave = useCallback(async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await saveStatblockAction(toPayload());
      if (!res.ok) {
        setError(res.error);
        setSaving(false);
        return;
      }
      setDirty(false);
      router.push(`/statblock/${res.id}`);
    } catch (e) {
      console.error(e);
      setError('Save failed');
      setSaving(false);
    }
    // toPayload is a closure over current state; we intentionally don't list it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleDuplicate = useCallback(async () => {
    if (!id) return;
    setError(null);
    setDupBusy(true);
    const r = await postDuplicateStatblock(toPayload());
    setDupBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.push(`/statblock/${encodeURIComponent(r.id)}/edit`);
    // toPayload: same as handleSave
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-parchment/70 hover:text-gold-400 text-xs uppercase tracking-wider transition-colors duration-fast"
        >
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" />
          Bestiary
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {id ? (
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={dupBusy || saving}
              className="grim-btn-ghost"
              aria-label="Duplicate as new stat block"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{dupBusy ? 'Duplicating…' : 'Duplicate'}</span>
            </button>
          ) : null}
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-parchment/50 hidden sm:block">
            {id ? 'Editing' : 'Forging new'}
          </p>
        </div>
      </div>
      <h1 className="font-display text-display-lg text-gold-400 mb-6 tracking-wide leading-none">
        {id ? 'Edit Stat Block' : 'New Stat Block'}
      </h1>

      <EditorModals
        templateOpen={templateModalOpen}
        careerOpen={careerModalOpen}
        templates={templatesList}
        careers={allCareers}
        onCloseTemplate={() => setTemplateModalOpen(false)}
        onCloseCareer={() => setCareerModalOpen(false)}
        onPickTemplate={(t) => applyTemplate(t)}
        onPickCareer={(pick) => {
          userChangedCareersRef.current = true;
          setSelectedCareers((prev) => {
            if (prev.some((c) => c.className === pick.className && c.careerName === pick.careerName))
              return prev;
            return [...prev, pick];
          });
          setCareerModalOpen(false);
        }}
        templateDialogRef={templateModalRef}
        careerDialogRef={careerModalRef}
      />

      <div className="grim-card p-6 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] lg:gap-8 items-start">
        <div className="space-y-6">
          <AnimatePresence>
            {error && (
              <motion.div
                key="editor-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease }}
                className="rounded border border-blood-700/60 bg-blood-900/30 p-3 text-parchment text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              ref={templateButtonRef}
              onClick={() => setTemplateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded border border-gold-700 bg-ink-800/70 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-400 transition-all duration-fast ease-grim hover:border-gold-500 hover:text-parchment hover:bg-blood-700/40"
            >
              <ScrollIcon className="w-3.5 h-3.5" />
              Choose template
            </button>
            <button
              type="button"
              ref={careerButtonRef}
              onClick={() => setCareerModalOpen(true)}
              className="grim-btn-ghost"
            >
              <SwordsIcon className="w-3.5 h-3.5" />
              Careers
            </button>
            {template && (
              <span className="text-parchment/80 text-sm inline-flex items-center gap-1.5">
                <span className="text-parchment/60 text-xs uppercase tracking-wider">Based on</span>
                <strong className="text-gold-400 font-display">{template.name}</strong>
                <button
                  type="button"
                  onClick={clearTemplate}
                  className="text-blood-400 hover:text-gold-400 text-xs underline decoration-dotted underline-offset-2"
                >
                  Clear
                </button>
              </span>
            )}
          </div>

          <div>
            <label className="grim-label">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Skeleton"
              className="grim-input"
            />
          </div>
          <section>
            <h3 className="grim-label mb-3">Characteristics</h3>
            {template ? (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randomiseCharacteristics}
                      onChange={(e) => setRandomise(e.target.checked)}
                      className="rounded border-iron-700 bg-ink-800 text-gold-500 focus:ring-gold-500/50"
                    />
                    <span className="text-parchment/90 text-sm">Randomise characteristics (2d10 per stat)</span>
                  </label>
                  {randomiseCharacteristics && (
                    <motion.button
                      type="button"
                      key={`reroll-btn-${rerollKey}`}
                      onClick={rerollCharacteristics}
                      className="grim-btn-ghost"
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.span
                        key={`reroll-icon-${rerollKey}`}
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.4, ease }}
                        className="inline-flex"
                      >
                        <DiceIcon className="w-3.5 h-3.5" />
                      </motion.span>
                      Re-roll
                    </motion.button>
                  )}
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {CHAR_ORDER.map((key) => {
                    const base = templateCharValue(template, key);
                    const advances = characteristicAdvances[key] ?? 0;
                    const addition = characteristicAdditions[key] ?? 10;
                    const total = base + advances + addition;
                    return (
                      <div key={key}>
                        <label className="block text-blood-400/90 font-display tracking-wider text-[0.65rem] mb-1 text-center">
                          {key}
                        </label>
                        <div className="grim-stat-cell text-parchment font-mono font-semibold text-sm mb-1 tabular-nums">
                          {total}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={characteristicAdvances[key]}
                          onChange={(e) => updateCharAdvance(key, e.target.value)}
                          placeholder="Adv"
                          className="grim-input !px-1.5 !py-1 text-center font-mono text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {CHAR_ORDER.map((key) => (
                  <div key={key}>
                    <label className="block text-blood-400/90 font-display tracking-wider text-[0.65rem] mb-1 text-center">
                      {key}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.characteristics[key]}
                      onChange={(e) => updateChar(key, e.target.value)}
                      placeholder="—"
                      className="grim-input !px-1.5 !py-1.5 text-center font-mono tabular-nums"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="grim-label">Size</label>
              <select
                value={form.size || DEFAULT_SIZE}
                onChange={(e) => update('size', e.target.value)}
                className="grim-input"
              >
                {SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="grim-label">Wounds</label>
              <div className="grim-input !bg-ink-900/60 font-mono tabular-nums text-parchment pointer-events-none">
                {computedWounds}
              </div>
              <p className="text-parchment/50 text-xs mt-1">Trait-aware</p>
            </div>
            <div>
              <label className="grim-label">Movement</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.movement}
                onChange={(e) => update('movement', e.target.value)}
                placeholder="—"
                className="grim-input font-mono tabular-nums"
              />
            </div>
          </div>
          {selectedCareers.length > 0 && (
            <section>
              <h3 className="grim-label mb-2">
                Careers
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCareers.map((c, idx) => (
                  <div
                    key={`${c.className}-${c.careerName}-${idx}`}
                    className="inline-flex items-center gap-1 rounded-full border border-iron-700 bg-ink-800/80 px-2 py-1 text-xs"
                  >
                    <span className="text-parchment/95">
                      {c.careerName}
                    </span>
                    <select
                      value={c.level || 1}
                      onChange={(e) => {
                        userChangedCareersRef.current = true;
                        const lvl = Number(e.target.value) || 1;
                        setSelectedCareers((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, level: lvl } : item
                          )
                        );
                      }}
                      className="bg-ink-800 border border-iron-700 rounded px-1 py-0.5 text-parchment text-xs focus:border-gold-500 focus:outline-none"
                    >
                      {[1, 2, 3, 4].map((l) => (
                        <option key={l} value={l}>Level {l}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        userChangedCareersRef.current = true;
                        setSelectedCareers((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="text-blood-400 hover:text-gold-400 px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          <div>
            <label className="grim-label">Talents (comma-separated)</label>
            <input
              type="text"
              value={form.talents}
              onChange={(e) => update('talents', e.target.value)}
              placeholder="e.g. Fearless, Undead"
              className="grim-input"
            />
          </div>
          <div>
            <label className="grim-label">Tags (comma-separated, for bestiary filters)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => update('tags', e.target.value)}
              placeholder="e.g. human, ally, ubersreik"
              className="grim-input"
            />
          </div>
          <div>
            <label className="grim-label" htmlFor="statblock-gm-notes">
              GM notes (not shown in player view)
            </label>
            <textarea
              id="statblock-gm-notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className="grim-input min-h-[4.5rem]"
              placeholder="Private reminders, scene hooks…"
            />
          </div>
          <div>
            <label className="grim-label" htmlFor="statblock-player-notes">
              Read aloud / player description
            </label>
            <textarea
              id="statblock-player-notes"
              value={form.playerNotes}
              onChange={(e) => update('playerNotes', e.target.value)}
              rows={3}
              className="grim-input min-h-[4.5rem]"
              placeholder="What players see or hear, without full stats…"
            />
          </div>

          <section>
            <h3 className="grim-label mb-3">Melee weapons</h3>
            <div className="space-y-2">
              <p className="text-parchment/80 text-xs mb-1">Selected</p>
              {selectedMeleeWeapons.length === 0 ? (
                <p className="text-parchment/60 text-xs italic">Add from categories below.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedMeleeWeapons.map((w, i) => (
                    <span key={`${w.category}-${w.name}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-iron-700 bg-ink-800/80 px-2 py-1 text-xs text-parchment/95">
                      {w.name} <span className="text-parchment/60">({w.category})</span>
                      <button type="button" onClick={() => setSelectedMeleeWeapons((prev) => prev.filter((x, j) => j !== i))} className="text-blood-400 hover:text-gold-400 px-1" aria-label={`Remove ${w.name}`}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                {(weaponsRef.melee?.categories || []).map((cat) => (
                  <div key={cat.name}>
                    <p className="text-parchment/70 text-xs mb-1">{cat.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {(cat.weapons || []).map((weapon) => (
                        <button
                          key={weapon.name}
                          type="button"
                          onClick={() => setSelectedMeleeWeapons((prev) => prev.some((x) => x.category === cat.name && x.name === weapon.name) ? prev : [...prev, { category: cat.name, name: weapon.name }])}
                          className="grim-pill text-xs px-2.5 py-1 cursor-pointer"
                        >
                          {weapon.name}
                        </button>
                      ))}
                      {(cat.weapons || []).length === 0 ? <span className="text-parchment/50 text-xs">—</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h3 className="grim-label mb-3">Ranged weapons</h3>
            <div className="space-y-2">
              <p className="text-parchment/80 text-xs mb-1">Selected</p>
              {selectedRangedWeapons.length === 0 ? (
                <p className="text-parchment/60 text-xs italic">Add from categories below; choose ammunition for each.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                    {selectedRangedWeapons.map((r, i) => {
                    const ammoList = (weaponsRef.ammunition?.categories || []).find((c) => c.name === r.category)?.ammunition || [];
                    return (
                      <div key={`${r.category}-${r.name}-${i}`} className="inline-flex items-center gap-1 rounded border border-iron-700 bg-ink-800/80 px-2 py-1">
                        <span className="text-parchment/95 text-xs">{r.name}</span>
                        <select
                          value={r.ammunition || ''}
                          onChange={(e) => setSelectedRangedWeapons((prev) => prev.map((x, j) => j === i ? { ...x, ammunition: e.target.value } : x))}
                          className="bg-ink-800 border border-iron-700 rounded px-1 py-0.5 text-parchment text-xs focus:border-gold-500 focus:outline-none"
                        >
                          <option value="">— Ammo —</option>
                          {ammoList.map((a) => (
                            <option key={a.name} value={a.name}>{a.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => setSelectedRangedWeapons((prev) => prev.filter((_, j) => j !== i))} className="text-blood-400 hover:text-gold-400 px-1 text-xs" aria-label={`Remove ${r.name}`}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                {(weaponsRef.ranged?.categories || []).map((cat) => (
                  <div key={cat.name}>
                    <p className="text-parchment/70 text-xs mb-1">{cat.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {(cat.weapons || []).map((weapon) => (
                        <button
                          key={weapon.name}
                          type="button"
                          onClick={() => setSelectedRangedWeapons((prev) => prev.some((x) => x.category === cat.name && x.name === weapon.name) ? prev : [...prev, { category: cat.name, name: weapon.name, ammunition: '' }])}
                          className="grim-pill text-xs px-2.5 py-1 cursor-pointer"
                        >
                          {weapon.name}
                        </button>
                      ))}
                      {(cat.weapons || []).length === 0 ? <span className="text-parchment/50 text-xs">—</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h3 className="grim-label mb-3">Armour</h3>
            <div className="space-y-2">
              <p className="text-parchment/80 text-xs mb-1">Selected</p>
              {selectedArmour.length === 0 ? (
                <p className="text-parchment/60 text-xs italic">Add from categories below.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedArmour.map((a, i) => (
                    <span key={`${a.category}-${a.name}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-iron-700 bg-ink-800/80 px-2 py-1 text-xs text-parchment/95">
                      {a.name} <span className="text-parchment/60">({a.category})</span>
                      <button type="button" onClick={() => setSelectedArmour((prev) => prev.filter((_, j) => j !== i))} className="text-blood-400 hover:text-gold-400 px-1" aria-label={`Remove ${a.name}`}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                {(armourRef.armour?.categories || []).map((cat) => (
                  <div key={cat.name}>
                    <p className="text-parchment/70 text-xs mb-1">{cat.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {(cat.items || []).map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setSelectedArmour((prev) => prev.some((x) => x.category === cat.name && x.name === item.name) ? prev : [...prev, { category: cat.name, name: item.name }])}
                          className="grim-pill text-xs px-2.5 py-1 cursor-pointer"
                        >
                          {item.name}
                        </button>
                      ))}
                      {(cat.items || []).length === 0 ? <span className="text-parchment/50 text-xs">—</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="pt-4 border-t border-iron-700/50">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="grim-btn-primary"
            >
              {saving ? (
                <>
                  <motion.span
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    className="inline-flex w-4 h-4"
                  >
                    <DiceIcon className="w-4 h-4" />
                  </motion.span>
                  Saving
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  Save Stat Block
                </>
              )}
            </button>
          </div>
        </div>

        <aside className="space-y-6 mt-6 lg:mt-0 lg:sticky lg:top-[92px] lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
          <section>
            <h3 className="grim-label mb-3">
              Skills
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-parchment/80 text-xs mb-1">Selected</p>
                {selectedSkills.length === 0 ? (
                  <p className="text-parchment/60 text-xs italic">
                    Click a skill below to add it.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((skill) => (
                        <div
                          key={skill.name}
                          className="inline-flex items-center gap-1 rounded-full border border-iron-700 bg-ink-800/80 px-2 py-1"
                        >
                          <span className="text-parchment/95 text-xs">{skill.name}</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={skill.advances}
                            onChange={(e) => updateSkillAdvances(skill.name, e.target.value)}
                            className="w-8 bg-ink-900 border border-iron-700 rounded px-1 py-0.5 text-parchment text-xs text-center font-mono tabular-nums focus:border-gold-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeSkill(skill.name)}
                            className="text-blood text-xs hover:text-gold px-1"
                            aria-label={`Remove ${skill.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <input
                    type="search"
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    placeholder="Filter skills…"
                    className="grim-input grim-input-dense flex-1 min-w-[8rem] text-xs"
                  />
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-parchment/80 text-xs whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={skillsGroupByCharacteristic}
                      onChange={(e) => setSkillsGroupByCharacteristic(e.target.checked)}
                      className="rounded border-iron-700 bg-ink-800 text-gold-500 focus:ring-gold-500/50"
                    />
                    By characteristic
                  </label>
                </div>
                <p className="text-parchment/80 text-xs mb-1">Available</p>
                <div className="max-h-64 overflow-y-auto rounded border border-iron-700/80 bg-ink-900/60 p-2 space-y-1">
                  {allSkills.length === 0 ? (
                    <p className="text-parchment/60 text-xs">No skills loaded.</p>
                  ) : filteredSkillsForPicker.grouped ? (
                    Object.keys(filteredSkillsForPicker.grouped)
                      .sort((a, b) => a.localeCompare(b))
                      .map((charKey) => (
                        <div key={charKey} className="mb-2 last:mb-0">
                          <p className="text-gold/80 text-[0.65rem] uppercase tracking-wide mb-0.5">{charKey}</p>
                          {(filteredSkillsForPicker.grouped[charKey] ?? []).map((skill) => (
                            <button
                              type="button"
                              key={skill.name}
                              onClick={() => addSkill(skill.name)}
                              className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood-700/30 text-parchment/90 transition-colors duration-fast"
                            >
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      ))
                  ) : filteredSkillsForPicker.flat?.length === 0 ? (
                    <p className="text-parchment/60 text-xs">No matches.</p>
                  ) : (
                    filteredSkillsForPicker.flat.map((skill) => (
                      <button
                        type="button"
                        key={skill.name}
                        onClick={() => addSkill(skill.name)}
                        className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood-700/30 text-parchment/90 transition-colors duration-fast"
                      >
                        {skill.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="grim-label mb-3">
              Traits
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-parchment/80 text-xs mb-1">Selected</p>
                {selectedTraits.length === 0 ? (
                  <p className="text-parchment/60 text-xs italic">
                    {template ? 'Add from Base, Optional, Generic or Other below.' : 'Click a trait below to add it.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedTraits.map((t) => {
                      const name = traitName(t);
                      const entry = getSelectedTraitEntry(name);
                      const ref = allTraits.find((tr) => tr.name === name);
                      const hasInput = Boolean(
                        ref && (ref.input === true || (typeof ref.input === 'string' && ref.input))
                      );
                      return (
                        <div
                          key={name}
                          className="inline-flex items-center gap-1 rounded-full border border-iron-700 bg-ink-800/80 px-2 py-1"
                        >
                          <span className="text-parchment/95 text-xs">{name}</span>
                          {hasInput ? (
                            <input
                              type="text"
                              value={entry.inputValue || ''}
                              onChange={(e) => updateTraitInputValue(name, e.target.value)}
                              placeholder={typeof ref?.input === 'string' ? ref.input : ''}
                              className="w-20 bg-ink-900 border border-iron-700 rounded px-1 py-0.5 text-parchment text-xs focus:border-gold-500 focus:outline-none"
                            />
                          ) : null}
                          <button
                            type="button"
                            onClick={() => toggleTraitOnBlock(name)}
                            className="text-blood text-xs hover:text-gold px-1"
                            aria-label={`Remove ${name}`}
                            title="Click to remove"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {template && (
                <>
                  {(() => {
                    const selectedNames = new Set(
                      selectedTraits.map((t) => traitName(t))
                    );
                    const baseEntries = templateTraitGroups(template)
                      .base.map((entry) => {
                        if (typeof entry === 'string') return { name: entry, defaultInput: '' };
                        const rec = entry as {
                          name?: string;
                          trait?: string;
                          inputValue?: string;
                        };
                        return {
                          name: rec.name || rec.trait || '',
                          defaultInput:
                            typeof rec.inputValue === 'string' ? rec.inputValue : '',
                        };
                      })
                      .filter((e) => e.name && !selectedNames.has(e.name));
                    return baseEntries.length > 0 ? (
                      <div>
                        <p className="text-gold/80 text-xs mb-1">Base (from template)</p>
                        <div className="max-h-32 overflow-y-auto rounded border border-iron-700/80 bg-ink-900/60 p-2 space-y-1">
                          {baseEntries.map(({ name, defaultInput }) => (
                            <button
                              type="button"
                              key={name}
                              onClick={() => addTrait(name, defaultInput)}
                              className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood-700/30 text-parchment/90 transition-colors duration-fast"
                            >
                              {name}
                              {defaultInput ? ` (${defaultInput})` : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                  {(() => {
                    const selectedNames = new Set(
                      selectedTraits.map((t) => traitName(t))
                    );
                    const optionalEntries = templateTraitGroups(template)
                      .optional.map((entry) => {
                        if (typeof entry === 'string') return { name: entry, defaultInput: '' };
                        const rec = entry as {
                          name?: string;
                          trait?: string;
                          inputValue?: string;
                        };
                        return {
                          name: rec.name || rec.trait || '',
                          defaultInput:
                            typeof rec.inputValue === 'string' ? rec.inputValue : '',
                        };
                      })
                      .filter((e) => e.name && !selectedNames.has(e.name));
                    return optionalEntries.length > 0 ? (
                      <div>
                        <p className="text-parchment/80 text-xs mb-1">Optional (from template)</p>
                        <div className="max-h-32 overflow-y-auto rounded border border-iron-700/80 bg-ink-900/60 p-2 space-y-1">
                          {optionalEntries.map(({ name, defaultInput }) => (
                            <button
                              type="button"
                              key={name}
                              onClick={() => addTrait(name, defaultInput)}
                              className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood-700/30 text-parchment/90 transition-colors duration-fast"
                            >
                              {name}
                              {defaultInput ? ` (${defaultInput})` : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                  {(() => {
                    const selectedNames = new Set(
                      selectedTraits.map((t) => traitName(t))
                    );
                    const optionalNames = new Set(
                      templateTraitGroups(template)
                        .optional.map((e) => {
                          if (typeof e === 'string') return e;
                          const rec = e as { name?: string; trait?: string };
                          return rec.name || rec.trait || '';
                        })
                        .filter(Boolean)
                    );
                    const generic = allTraits.filter(
                      (t) => t.generic && !optionalNames.has(t.name) && !selectedNames.has(t.name)
                    );
                    const other = allTraits.filter(
                      (t) => !t.generic && !optionalNames.has(t.name) && !selectedNames.has(t.name)
                    );
                    return (
                      <>
                        {generic.length > 0 && (
                          <div>
                            <p className="text-parchment/80 text-xs mb-1">Generic traits</p>
                            <div className="max-h-32 overflow-y-auto rounded border border-iron-700/80 bg-ink-900/60 p-2 space-y-1">
                              {generic.map((trait) => (
                                <button
                                  type="button"
                                  key={trait.name}
                                  onClick={() => addTrait(trait.name)}
                                  className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood-700/30 text-parchment/90 transition-colors duration-fast"
                                >
                                  {trait.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {other.length > 0 && (
                          <div>
                            <p className="text-parchment/80 text-xs mb-1">Other traits</p>
                            <div className="max-h-32 overflow-y-auto rounded border border-iron-700/80 bg-ink-900/60 p-2 space-y-1">
                              {other.map((trait) => (
                                <button
                                  type="button"
                                  key={trait.name}
                                  onClick={() => addTrait(trait.name)}
                                  className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood-700/30 text-parchment/90 transition-colors duration-fast"
                                >
                                  {trait.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
              {!template && (
                <div>
                  <p className="text-parchment/80 text-xs mb-1">Available</p>
                  <div className="max-h-64 overflow-y-auto rounded border border-iron-700/80 bg-ink-900/60 p-2 space-y-1">
                    {(() => {
                      const selectedNames = new Set(
                        selectedTraits.map((t) => traitName(t))
                      );
                      const available = allTraits.filter((t) => !selectedNames.has(t.name));
                      return available.length === 0 ? (
                        <p className="text-parchment/60 text-xs">No more traits to add.</p>
                      ) : (
                        available.map((trait) => (
                          <button
                            type="button"
                            key={trait.name}
                            onClick={() => addTrait(trait.name)}
                            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood-700/30 text-parchment/90 transition-colors duration-fast"
                          >
                            {trait.name}
                          </button>
                        ))
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
