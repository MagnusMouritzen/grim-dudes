import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';

const API = '/api';
const CHAR_ORDER = ['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'];

import { woundsFromSize, SIZES, DEFAULT_SIZE } from '../lib/statblockUtils';

function roll2d10() {
  return (1 + Math.floor(Math.random() * 10)) + (1 + Math.floor(Math.random() * 10));
}

const emptyCharacteristics = Object.fromEntries(CHAR_ORDER.map((k) => [k, '']));
const zeroAdvances = Object.fromEntries(CHAR_ORDER.map((k) => [k, 0]));
const defaultAdditions = Object.fromEntries(CHAR_ORDER.map((k) => [k, 10]));

function computeCareerEffectsFrom(classes, careersArray) {
  const careerSkillAdv = new Map();
  const careerCharAdv = new Map();
  (Array.isArray(careersArray) ? careersArray : []).forEach((sel) => {
    const cls = (Array.isArray(classes) ? classes : []).find((c) => c.name === sel.className);
    if (!cls) return;
    const career = Array.isArray(cls.careers) ? cls.careers.find((c) => c.name === sel.careerName) : null;
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

export default function StatBlockEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [allTraits, setAllTraits] = useState([]);
  const [allCareers, setAllCareers] = useState({ classes: [] });
  const [templatesList, setTemplatesList] = useState([]);
  const [template, setTemplate] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [characteristicAdvances, setCharacteristicAdvances] = useState({ ...zeroAdvances });
  const [characteristicAdditions, setCharacteristicAdditions] = useState({ ...defaultAdditions });
  const [randomiseCharacteristics, setRandomiseCharacteristics] = useState(false);
  const [existingId, setExistingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    characteristics: { ...emptyCharacteristics },
    size: DEFAULT_SIZE,
    movement: '',
    talents: '',
  });
  const [weaponsRef, setWeaponsRef] = useState({ qualitiesAndFlaws: [], melee: { categories: [] }, ranged: { categories: [] }, ammunition: { categories: [] } });
  const [armourRef, setArmourRef] = useState({ qualitiesAndFlaws: [], armour: { categories: [] } });
  const [selectedMeleeWeapons, setSelectedMeleeWeapons] = useState([]);
  const [selectedRangedWeapons, setSelectedRangedWeapons] = useState([]);
  const [selectedArmour, setSelectedArmour] = useState([]);
  const [selectedCareers, setSelectedCareers] = useState([]);
  const baseCharacteristicRef = useRef({});
  const userChangedCareersRef = useRef(false);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateChar = (key, value) => {
    setForm((prev) => ({
      ...prev,
      characteristics: { ...prev.characteristics, [key]: value },
    }));
  };

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
        const sortedSkills = Array.isArray(skills)
          ? [...skills].sort((a, b) => a.name.localeCompare(b.name))
          : [];
        const sortedTraits = Array.isArray(traits)
          ? [...traits].sort((a, b) => a.name.localeCompare(b.name))
          : [];
        const sortedTemplates = Array.isArray(templates)
          ? [...templates].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          : [];
        setAllSkills(sortedSkills);
        setAllTraits(sortedTraits);
        setTemplatesList(sortedTemplates);
        setWeaponsRef(weapons || { qualitiesAndFlaws: [], melee: { categories: [] }, ranged: { categories: [] }, ammunition: { categories: [] } });
        setArmourRef(armour || { qualitiesAndFlaws: [], armour: { categories: [] } });
        setAllCareers(careers && typeof careers === 'object' ? careers : { classes: [] });
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
        .map(([name, advances]) => ({ name, advances }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );

    if (template) {
      setCharacteristicAdvances(
        Object.fromEntries(CHAR_ORDER.map((k) => [k, careerCharAdv.get(k) ?? 0]))
      );
    } else {
      const base = baseCharacteristicRef.current;
      setForm((f) => {
        const nextCh = { ...f.characteristics };
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
      return;
    }
    fetch(`${API}/statblocks/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then((data) => {
        setExistingId(data.id);
        const isTemplateBased = data.templateId && data.characteristics && typeof data.characteristics.WS === 'object';
        if (isTemplateBased && data.templateId) {
          fetch(`${API}/templates/${encodeURIComponent(data.templateId)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((tpl) => {
              if (tpl) setTemplate(tpl);
              const advances = { ...zeroAdvances };
              const additions = { ...defaultAdditions };
              CHAR_ORDER.forEach((k) => {
                const v = data.characteristics[k];
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
          const careersFromData = Array.isArray(data.careers)
            ? data.careers.map((c) => ({
                className: c.className || c.class || '',
                careerName: c.careerName || c.career || '',
                level: c.level || 1,
              })).filter((c) => c.careerName)
            : [];
          const { careerCharAdv } = computeCareerEffectsFrom(allCareers.classes || [], careersFromData);
          baseCharacteristicRef.current = CHAR_ORDER.reduce((acc, k) => {
            const v = data.characteristics?.[k];
            const num = typeof v === 'number' && Number.isFinite(v) ? v : 0;
            acc[k] = num - (careerCharAdv.get(k) ?? 0);
            return acc;
          }, {});
        }
        setForm((prev) => ({
          ...prev,
          name: data.name || '',
          characteristics: { ...emptyCharacteristics, ...(typeof data.characteristics?.WS === 'number' ? data.characteristics : {}) },
          size: data.size || DEFAULT_SIZE,
          movement: data.movement != null ? String(data.movement) : '',
          talents: Array.isArray(data.talents) ? data.talents.join(', ') : '',
        }));
        const melee = Array.isArray(data.weapons?.melee) ? data.weapons.melee : [];
        const ranged = Array.isArray(data.weapons?.ranged) ? data.weapons.ranged : [];
        setSelectedMeleeWeapons(melee.map((w) => ({ category: w.category || '', name: w.name || '' })).filter((w) => w.name));
        setSelectedRangedWeapons(ranged.map((w) => ({ category: w.category || '', name: w.name || '', ammunition: w.ammunition || '' })).filter((w) => w.name));
        setSelectedArmour(Array.isArray(data.armour) ? data.armour.map((a) => ({ category: a.category || '', name: a.name || '' })).filter((a) => a.name) : []);
        setSelectedCareers(Array.isArray(data.careers)
          ? data.careers.map((c) => ({
              className: c.className || c.class || '',
              careerName: c.careerName || c.career || '',
              level: c.level || 1,
            })).filter((c) => c.careerName)
          : []);
        const normalisedSkills = (Array.isArray(data.skills) ? data.skills : []).map((s) => {
          if (typeof s === 'string') return { name: s, advances: 0 };
          const name = s.name || s.skill || '';
          const advances = Number.isFinite(s.advances) ? s.advances : 0;
          return { name, advances };
        });
        setSelectedSkills(normalisedSkills);
        const rawTraits = Array.isArray(data.traits) ? data.traits : [];
        const normalisedTraits = rawTraits.map((t) => {
          if (typeof t === 'string') return { name: t, inputValue: '' };
          return { name: t.name || t.trait || '', inputValue: typeof t.inputValue === 'string' ? t.inputValue : '' };
        }).filter((t) => t.name);
        setSelectedTraits(normalisedTraits);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const applyTemplate = (tpl) => {
    setTemplate(tpl);
    setTemplateModalOpen(false);
    setForm((prev) => ({
      ...prev,
      name: prev.name || tpl.name || '',
      size: tpl.size || DEFAULT_SIZE,
      movement: tpl.movement != null ? String(tpl.movement) : '',
      talents: Array.isArray(tpl.talents) ? tpl.talents.join(', ') : '',
    }));
    setCharacteristicAdvances({ ...zeroAdvances });
    setCharacteristicAdditions({ ...defaultAdditions });
    setRandomiseCharacteristics(false);
    setSelectedMeleeWeapons([]);
    setSelectedRangedWeapons([]);
    setSelectedArmour([]);
    setSelectedCareers([]);
    userChangedCareersRef.current = true;
    setSelectedTraits(Array.isArray(tpl.traits?.base)
      ? tpl.traits.base.map((t) => typeof t === 'string' ? { name: t, inputValue: '' } : { name: t.name || t.trait || '', inputValue: typeof t.inputValue === 'string' ? t.inputValue : '' }).filter((t) => t.name).sort((a, b) => a.name.localeCompare(b.name))
      : []);
    setSelectedSkills([]);
  };

  const clearTemplate = () => {
    setTemplate(null);
    setCharacteristicAdvances({ ...zeroAdvances });
    setCharacteristicAdditions({ ...defaultAdditions });
    setRandomiseCharacteristics(false);
    setForm((prev) => ({ ...prev, characteristics: { ...emptyCharacteristics } }));
  };

  const setRandomise = (on) => {
    setRandomiseCharacteristics(on);
    if (on) {
      const next = {};
      CHAR_ORDER.forEach((k) => { next[k] = roll2d10(); });
      setCharacteristicAdditions(next);
    } else {
      setCharacteristicAdditions({ ...defaultAdditions });
    }
  };

  const rerollCharacteristics = () => {
    const next = {};
    CHAR_ORDER.forEach((k) => { next[k] = roll2d10(); });
    setCharacteristicAdditions(next);
  };

  const updateCharAdvance = (key, value) => {
    setCharacteristicAdvances((prev) => ({
      ...prev,
      [key]: value === '' ? 0 : Number(value) || 0,
    }));
  };

  const addSkill = (name) => {
    setSelectedSkills((prev) => {
      if (prev.some((s) => s.name === name)) return prev;
      return [...prev, { name, advances: 0 }];
    });
  };

  const removeSkill = (name) => {
    setSelectedSkills((prev) => prev.filter((s) => s.name !== name));
  };

  const updateSkillAdvances = (name, value) => {
    setSelectedSkills((prev) =>
      prev.map((s) =>
        s.name === name ? { ...s, advances: value === '' ? 0 : Number(value) || 0 } : s
      )
    );
  };

  const addTrait = (name, defaultInputValue = '') => {
    setSelectedTraits((prev) => {
      if (prev.some((t) => (typeof t === 'string' ? t : t.name) === name)) return prev;
      return [...prev, { name, inputValue: defaultInputValue }].sort((a, b) => (a.name || a).localeCompare(b.name || b));
    });
  };

  const toggleTraitOnBlock = (name) => {
    setSelectedTraits((prev) =>
      prev.filter((t) => (typeof t === 'string' ? t : t.name) !== name)
    );
  };

  const updateTraitInputValue = (name, value) => {
    setSelectedTraits((prev) =>
      prev.map((t) => {
        const n = typeof t === 'string' ? t : t.name;
        if (n !== name) return t;
        return typeof t === 'object' ? { ...t, inputValue: value } : { name: t, inputValue: value };
      })
    );
  };

  const getSelectedTraitEntry = (name) => {
    const t = selectedTraits.find((x) => (typeof x === 'string' ? x : x.name) === name);
    if (typeof t === 'string') return { name: t, inputValue: '' };
    return t || { name, inputValue: '' };
  };

  const getCharForWounds = (key) => {
    if (template) {
      const base = typeof template.characteristics?.[key] === 'number' ? template.characteristics[key] : 0;
      const advances = characteristicAdvances[key] ?? 0;
      const addition = characteristicAdditions[key] ?? 10;
      return base + advances + addition;
    }
    const v = form.characteristics[key];
    const n = Number(v);
    return v !== '' && v != null && Number.isFinite(n) ? n : 0;
  };

  const computedWounds = woundsFromSize(form.size, getCharForWounds);

  const toPayload = () => {
    const num = (v) => (v === '' || v == null ? undefined : Number(v));
    const talents = form.talents
      ? form.talents.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const traitsPayload = selectedTraits.map((t) => {
      const name = typeof t === 'string' ? t : t.name;
      const inputValue = typeof t === 'object' && t != null && typeof t.inputValue === 'string' ? t.inputValue : undefined;
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
    if (template) {
      const characteristics = {};
      CHAR_ORDER.forEach((k) => {
        const base = typeof template.characteristics?.[k] === 'number' ? template.characteristics[k] : 0;
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
        weapons: (selectedMeleeWeapons.length > 0 || selectedRangedWeapons.length > 0)
          ? { melee: selectedMeleeWeapons, ranged: selectedRangedWeapons }
          : undefined,
        armour: selectedArmour.length > 0 ? selectedArmour : undefined,
      };
    }
    const characteristics = {};
    CHAR_ORDER.forEach((k) => {
      const v = form.characteristics[k];
      const n = (v !== '' && v != null) ? num(v) : undefined;
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
      weapons: (selectedMeleeWeapons.length > 0 || selectedRangedWeapons.length > 0)
        ? { melee: selectedMeleeWeapons, ranged: selectedRangedWeapons }
        : undefined,
      armour: selectedArmour.length > 0 ? selectedArmour : undefined,
    };
  };

  const handleSave = () => {
    setError(null);
    setSaving(true);
    fetch(`${API}/statblocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toPayload()),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Save failed'))))
      .then((data) => navigate(`/statblock/${data.id}`))
      .catch((e) => {
        setError(e.message);
        setSaving(false);
      });
  };

  return (
    <div>
      <Link
        to="/"
        className="text-parchment/80 hover:text-parchment text-sm mb-4 inline-block"
      >
        ← Bestiary
      </Link>
      <h1 className="font-display text-3xl text-gold mb-6 tracking-wide">
        {id ? 'Edit Stat Block' : 'New Stat Block'}
      </h1>

      {templateModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4" onClick={() => setTemplateModalOpen(false)}>
          <div className="rounded-lg border-2 border-iron/70 bg-[#0f0d0a] max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blood/20 px-4 py-3 border-b border-gold/30 flex justify-between items-center">
              <h2 className="font-display text-gold">Choose template</h2>
              <button type="button" className="text-parchment hover:text-gold" onClick={() => setTemplateModalOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96 space-y-1">
              {templatesList.length === 0 ? (
                <p className="text-parchment/70">No templates available.</p>
              ) : (
                templatesList.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left px-3 py-2 rounded border border-iron/60 bg-ink/60 hover:border-gold/50 text-parchment"
                  >
                    {t.name || t.id}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {careerModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4" onClick={() => setCareerModalOpen(false)}>
          <div className="rounded-lg border-2 border-iron/70 bg-[#0f0d0a] max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-blood/20 px-4 py-3 border-b border-gold/30 flex justify-between items-center">
              <h2 className="font-display text-gold">Choose career</h2>
              <button type="button" className="text-parchment hover:text-gold" onClick={() => setCareerModalOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
              {!(Array.isArray(allCareers.classes) && allCareers.classes.length) ? (
                <p className="text-parchment/70 text-sm">No careers available.</p>
              ) : (
                allCareers.classes.map((cls) => (
                  <div key={cls.name}>
                    <h3 className="text-gold/90 text-xs uppercase tracking-wider mb-1">{cls.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {(cls.careers || []).map((career) => (
                        <button
                          key={career.name}
                          type="button"
                          onClick={() => {
                            userChangedCareersRef.current = true;
                            setSelectedCareers((prev) => {
                              if (prev.some((c) => c.className === cls.name && c.careerName === career.name)) return prev;
                              return [...prev, { className: cls.name, careerName: career.name, level: 1 }];
                            });
                            setCareerModalOpen(false);
                          }}
                          className="px-3 py-1 text-xs rounded border border-iron/60 bg-ink/70 hover:border-gold/50 text-parchment/90"
                        >
                          {career.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border-2 border-iron/70 bg-[#0f0d0a] p-6 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] lg:gap-8">
        <div className="space-y-6">
          {error && (
            <div className="rounded border border-blood/60 bg-blood/10 p-3 text-parchment text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="px-3 py-1.5 text-sm uppercase tracking-wider rounded border border-gold/60 bg-gold/20 text-gold hover:bg-gold/30"
            >
              Choose template
            </button>
            <button
              type="button"
              onClick={() => setCareerModalOpen(true)}
              className="px-3 py-1.5 text-sm uppercase tracking-wider rounded border border-iron/60 bg-ink/70 text-parchment hover:border-gold/50"
            >
              Careers
            </button>
            {template && (
              <span className="text-parchment/80 text-sm">
                Based on: <strong className="text-gold">{template.name}</strong>
                <button type="button" onClick={clearTemplate} className="ml-2 text-blood hover:text-gold text-xs">Clear template</button>
              </span>
            )}
          </div>

          <div>
            <label className="block text-gold/90 text-sm uppercase tracking-wider mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Skeleton"
              className="w-full bg-ink border border-iron/60 rounded px-3 py-2 text-parchment placeholder-parchment/40 focus:border-gold/60 focus:outline-none"
            />
          </div>
          <section>
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-3 font-semibold">Characteristics</h3>
            {template ? (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randomiseCharacteristics}
                      onChange={(e) => setRandomise(e.target.checked)}
                      className="rounded border-iron/70 bg-ink text-gold focus:ring-gold/50"
                    />
                    <span className="text-parchment/90 text-sm">Randomise characteristics (2d10 per stat)</span>
                  </label>
                  {randomiseCharacteristics && (
                    <button
                      type="button"
                      onClick={rerollCharacteristics}
                      className="px-2 py-1 text-xs uppercase rounded border border-iron/70 bg-ink/80 text-parchment hover:border-gold/50"
                    >
                      Re-roll
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {CHAR_ORDER.map((key) => {
                    const base = typeof template.characteristics?.[key] === 'number' ? template.characteristics[key] : 0;
                    const advances = characteristicAdvances[key] ?? 0;
                    const addition = characteristicAdditions[key] ?? 10;
                    const total = base + advances + addition;
                    return (
                      <div key={key}>
                        <label className="block text-blood/90 text-xs mb-0.5">{key}</label>
                        <div className="bg-ink/60 rounded px-2 py-1 text-center text-parchment font-semibold text-sm mb-0.5">
                          {total}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={characteristicAdvances[key]}
                          onChange={(e) => updateCharAdvance(key, e.target.value)}
                          placeholder="Adv"
                          className="w-full bg-ink border border-iron/60 rounded px-2 py-0.5 text-parchment text-center text-xs focus:border-gold/60 focus:outline-none"
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
                    <label className="block text-blood/90 text-xs mb-0.5">{key}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.characteristics[key]}
                      onChange={(e) => updateChar(key, e.target.value)}
                      placeholder="—"
                      className="w-full bg-ink border border-iron/60 rounded px-2 py-1 text-parchment text-center focus:border-gold/60 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-gold/90 text-sm uppercase tracking-wider mb-1">Size</label>
              <select
                value={form.size || DEFAULT_SIZE}
                onChange={(e) => update('size', e.target.value)}
                className="w-full bg-ink border border-iron/60 rounded px-3 py-2 text-parchment focus:border-gold/60 focus:outline-none"
              >
                {SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gold/90 text-sm uppercase tracking-wider mb-1">Wounds</label>
              <div className="w-full bg-ink/60 border border-iron/60 rounded px-3 py-2 text-parchment">
                {computedWounds}
              </div>
              <p className="text-parchment/50 text-xs mt-0.5">Calculated from Size and characteristics</p>
            </div>
            <div>
              <label className="block text-gold/90 text-sm uppercase tracking-wider mb-1">Movement</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.movement}
                onChange={(e) => update('movement', e.target.value)}
                placeholder="—"
                className="w-full bg-ink border border-iron/60 rounded px-3 py-2 text-parchment focus:border-gold/60 focus:outline-none"
              />
            </div>
          </div>
          {selectedCareers.length > 0 && (
            <section>
              <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-2 font-semibold">
                Careers
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCareers.map((c, idx) => (
                  <div
                    key={`${c.className}-${c.careerName}-${idx}`}
                    className="inline-flex items-center gap-1 rounded-full border border-iron/70 bg-ink/80 px-2 py-1 text-xs"
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
                      className="bg-ink border border-iron/60 rounded px-1 py-0.5 text-parchment text-xs focus:border-gold/60 focus:outline-none"
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
                      className="text-blood hover:text-gold px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
          <div>
            <label className="block text-gold/90 text-sm uppercase tracking-wider mb-1">Talents (comma-separated)</label>
            <input
              type="text"
              value={form.talents}
              onChange={(e) => update('talents', e.target.value)}
              placeholder="e.g. Fearless, Undead"
              className="w-full bg-ink border border-iron/60 rounded px-3 py-2 text-parchment placeholder-parchment/40 focus:border-gold/60 focus:outline-none"
            />
          </div>

          <section>
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-3 font-semibold">Melee weapons</h3>
            <div className="space-y-2">
              <p className="text-parchment/80 text-xs mb-1">Selected</p>
              {selectedMeleeWeapons.length === 0 ? (
                <p className="text-parchment/60 text-xs italic">Add from categories below.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedMeleeWeapons.map((w, i) => (
                    <span key={`${w.category}-${w.name}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-iron/70 bg-ink/80 px-2 py-1 text-xs text-parchment/95">
                      {w.name} <span className="text-parchment/60">({w.category})</span>
                      <button type="button" onClick={() => setSelectedMeleeWeapons((prev) => prev.filter((x, j) => j !== i))} className="text-blood hover:text-gold px-1" aria-label={`Remove ${w.name}`}>×</button>
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
                          className="px-2 py-1 text-xs rounded border border-iron/60 bg-ink/60 hover:border-gold/50 text-parchment/90"
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
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-3 font-semibold">Ranged weapons</h3>
            <div className="space-y-2">
              <p className="text-parchment/80 text-xs mb-1">Selected</p>
              {selectedRangedWeapons.length === 0 ? (
                <p className="text-parchment/60 text-xs italic">Add from categories below; choose ammunition for each.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedRangedWeapons.map((r, i) => {
                    const ammoList = (weaponsRef.ammunition?.categories || []).find((c) => c.name === r.category)?.ammunition || [];
                    return (
                      <div key={`${r.category}-${r.name}-${i}`} className="inline-flex items-center gap-1 rounded border border-iron/70 bg-ink/80 px-2 py-1">
                        <span className="text-parchment/95 text-xs">{r.name}</span>
                        <select
                          value={r.ammunition || ''}
                          onChange={(e) => setSelectedRangedWeapons((prev) => prev.map((x, j) => j === i ? { ...x, ammunition: e.target.value } : x))}
                          className="bg-ink border border-iron/60 rounded px-1 py-0.5 text-parchment text-xs focus:border-gold/60 focus:outline-none"
                        >
                          <option value="">— Ammo —</option>
                          {ammoList.map((a) => (
                            <option key={a.name} value={a.name}>{a.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => setSelectedRangedWeapons((prev) => prev.filter((_, j) => j !== i))} className="text-blood hover:text-gold px-1 text-xs" aria-label={`Remove ${r.name}`}>×</button>
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
                          className="px-2 py-1 text-xs rounded border border-iron/60 bg-ink/60 hover:border-gold/50 text-parchment/90"
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
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-3 font-semibold">Armour</h3>
            <div className="space-y-2">
              <p className="text-parchment/80 text-xs mb-1">Selected</p>
              {selectedArmour.length === 0 ? (
                <p className="text-parchment/60 text-xs italic">Add from categories below.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedArmour.map((a, i) => (
                    <span key={`${a.category}-${a.name}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-iron/70 bg-ink/80 px-2 py-1 text-xs text-parchment/95">
                      {a.name} <span className="text-parchment/60">({a.category})</span>
                      <button type="button" onClick={() => setSelectedArmour((prev) => prev.filter((_, j) => j !== i))} className="text-blood hover:text-gold px-1" aria-label={`Remove ${a.name}`}>×</button>
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
                          className="px-2 py-1 text-xs rounded border border-iron/60 bg-ink/60 hover:border-gold/50 text-parchment/90"
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

          <div className="pt-4 border-t border-iron/40">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blood text-parchment font-display uppercase tracking-wider rounded hover:bg-blood/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : 'Save Stat Block'}
            </button>
          </div>
        </div>

        <aside className="space-y-6 mt-6 lg:mt-0">
          <section>
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-3 font-semibold">
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
                          className="inline-flex items-center gap-1 rounded-full border border-iron/70 bg-ink/80 px-2 py-1"
                        >
                          <span className="text-parchment/95 text-xs">{skill.name}</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={skill.advances}
                            onChange={(e) => updateSkillAdvances(skill.name, e.target.value)}
                            className="w-7 bg-ink border border-iron/70 rounded px-1 py-0.5 text-parchment text-xs focus:border-gold/60 focus:outline-none"
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
                <p className="text-parchment/80 text-xs mb-1">Available</p>
                <div className="max-h-64 overflow-y-auto rounded border border-iron/60 bg-ink/60 p-2 space-y-1">
                  {allSkills.length === 0 ? (
                    <p className="text-parchment/60 text-xs">No skills loaded.</p>
                  ) : (
                    allSkills.map((skill) => (
                      <button
                        type="button"
                        key={skill.name}
                        onClick={() => addSkill(skill.name)}
                        className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood/20 text-parchment/90"
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
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-3 font-semibold">
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
                      const name = typeof t === 'string' ? t : t.name;
                      const entry = getSelectedTraitEntry(name);
                      const ref = allTraits.find((tr) => tr.name === name);
                      const hasInput = ref && (ref.input === true || (typeof ref.input === 'string' && ref.input));
                      return (
                        <div
                          key={name}
                          className="inline-flex items-center gap-1 rounded-full border border-iron/70 bg-ink/80 px-2 py-1"
                        >
                          <span className="text-parchment/95 text-xs">{name}</span>
                          {hasInput ? (
                            <input
                              type="text"
                              value={entry.inputValue || ''}
                              onChange={(e) => updateTraitInputValue(name, e.target.value)}
                              placeholder={typeof ref.input === 'string' ? ref.input : ''}
                              className="w-20 bg-ink border border-iron/70 rounded px-1 py-0.5 text-parchment text-xs focus:border-gold/60 focus:outline-none"
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
                    const selectedNames = new Set(selectedTraits.map((t) => (typeof t === 'string' ? t : t.name)));
                    const baseEntries = (Array.isArray(template.traits?.base) ? template.traits.base : [])
                      .map((entry) => {
                        const name = typeof entry === 'string' ? entry : (entry.name || entry.trait || '');
                        const defaultInput = typeof entry === 'object' && entry != null && typeof entry.inputValue === 'string' ? entry.inputValue : '';
                        return { name, defaultInput };
                      })
                      .filter((e) => e.name && !selectedNames.has(e.name));
                    return baseEntries.length > 0 ? (
                      <div>
                        <p className="text-gold/80 text-xs mb-1">Base (from template)</p>
                        <div className="max-h-32 overflow-y-auto rounded border border-iron/60 bg-ink/60 p-2 space-y-1">
                          {baseEntries.map(({ name, defaultInput }) => (
                            <button
                              type="button"
                              key={name}
                              onClick={() => addTrait(name, defaultInput)}
                              className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood/20 text-parchment/90"
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
                    const selectedNames = new Set(selectedTraits.map((t) => (typeof t === 'string' ? t : t.name)));
                    const optionalEntries = (Array.isArray(template.traits?.optional) ? template.traits.optional : [])
                      .map((entry) => {
                        const name = typeof entry === 'string' ? entry : (entry.name || entry.trait || '');
                        const defaultInput = typeof entry === 'object' && entry != null && typeof entry.inputValue === 'string' ? entry.inputValue : '';
                        return { name, defaultInput };
                      })
                      .filter((e) => e.name && !selectedNames.has(e.name));
                    return optionalEntries.length > 0 ? (
                      <div>
                        <p className="text-parchment/80 text-xs mb-1">Optional (from template)</p>
                        <div className="max-h-32 overflow-y-auto rounded border border-iron/60 bg-ink/60 p-2 space-y-1">
                          {optionalEntries.map(({ name, defaultInput }) => (
                            <button
                              type="button"
                              key={name}
                              onClick={() => addTrait(name, defaultInput)}
                              className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood/20 text-parchment/90"
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
                    const selectedNames = new Set(selectedTraits.map((t) => (typeof t === 'string' ? t : t.name)));
                    const optionalNames = new Set(
                      (Array.isArray(template.traits?.optional) ? template.traits.optional : [])
                        .map((e) => (typeof e === 'string' ? e : e.name || e.trait))
                        .filter(Boolean)
                    );
                    const generic = allTraits.filter((t) => t.generic && !optionalNames.has(t.name) && !selectedNames.has(t.name));
                    const other = allTraits.filter((t) => !t.generic && !optionalNames.has(t.name) && !selectedNames.has(t.name));
                    return (
                      <>
                        {generic.length > 0 && (
                          <div>
                            <p className="text-parchment/80 text-xs mb-1">Generic traits</p>
                            <div className="max-h-32 overflow-y-auto rounded border border-iron/60 bg-ink/60 p-2 space-y-1">
                              {generic.map((trait) => (
                                <button
                                  type="button"
                                  key={trait.name}
                                  onClick={() => addTrait(trait.name)}
                                  className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood/20 text-parchment/90"
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
                            <div className="max-h-32 overflow-y-auto rounded border border-iron/60 bg-ink/60 p-2 space-y-1">
                              {other.map((trait) => (
                                <button
                                  type="button"
                                  key={trait.name}
                                  onClick={() => addTrait(trait.name)}
                                  className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood/20 text-parchment/90"
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
                  <div className="max-h-64 overflow-y-auto rounded border border-iron/60 bg-ink/60 p-2 space-y-1">
                    {(() => {
                      const selectedNames = new Set(selectedTraits.map((t) => (typeof t === 'string' ? t : t.name)));
                      const available = allTraits.filter((t) => !selectedNames.has(t.name));
                      return available.length === 0 ? (
                        <p className="text-parchment/60 text-xs">No more traits to add.</p>
                      ) : (
                        available.map((trait) => (
                          <button
                            type="button"
                            key={trait.name}
                            onClick={() => addTrait(trait.name)}
                            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood/20 text-parchment/90"
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
