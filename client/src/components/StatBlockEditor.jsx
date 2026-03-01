import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';

const API = '/api';
const CHAR_ORDER = ['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'];

function roll2d10() {
  return (1 + Math.floor(Math.random() * 10)) + (1 + Math.floor(Math.random() * 10));
}

const emptyCharacteristics = Object.fromEntries(CHAR_ORDER.map((k) => [k, '']));
const zeroAdvances = Object.fromEntries(CHAR_ORDER.map((k) => [k, 0]));
const defaultAdditions = Object.fromEntries(CHAR_ORDER.map((k) => [k, 10]));

export default function StatBlockEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [allTraits, setAllTraits] = useState([]);
  const [templatesList, setTemplatesList] = useState([]);
  const [template, setTemplate] = useState(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [characteristicAdvances, setCharacteristicAdvances] = useState({ ...zeroAdvances });
  const [characteristicAdditions, setCharacteristicAdditions] = useState({ ...defaultAdditions });
  const [randomiseCharacteristics, setRandomiseCharacteristics] = useState(false);
  const [existingId, setExistingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    characteristics: { ...emptyCharacteristics },
    wounds: '',
    movement: '',
    talents: '',
    armour: '',
    weapons: '',
  });

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
    ])
      .then(([skills, traits, templates]) => {
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
      })
      .catch(() => {
        // fail silently; editor will still work without reference data
      });
  }, []);

  useEffect(() => {
    if (!id) return;
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
        }
        setForm((prev) => ({
          ...prev,
          name: data.name || '',
          characteristics: { ...emptyCharacteristics, ...(typeof data.characteristics?.WS === 'number' ? data.characteristics : {}) },
          wounds: data.wounds != null ? String(data.wounds) : '',
          movement: data.movement != null ? String(data.movement) : '',
          talents: Array.isArray(data.talents) ? data.talents.join(', ') : '',
          armour: data.armour || '',
          weapons: data.weapons || '',
        }));
        const normalisedSkills = (Array.isArray(data.skills) ? data.skills : []).map((s) => {
          if (typeof s === 'string') return { name: s, advances: 0 };
          const name = s.name || s.skill || '';
          const advances = Number.isFinite(s.advances) ? s.advances : 0;
          return { name, advances };
        });
        setSelectedSkills(normalisedSkills);
        setSelectedTraits(
          Array.isArray(data.traits)
            ? data.traits.slice().sort((a, b) => a.localeCompare(b))
            : []
        );
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const applyTemplate = (tpl) => {
    setTemplate(tpl);
    setTemplateModalOpen(false);
    setForm((prev) => ({
      ...prev,
      name: prev.name || tpl.name || '',
      wounds: tpl.wounds != null ? String(tpl.wounds) : '',
      movement: tpl.movement != null ? String(tpl.movement) : '',
      talents: Array.isArray(tpl.talents) ? tpl.talents.join(', ') : '',
      armour: tpl.armour || '',
      weapons: tpl.weapons || '',
    }));
    setCharacteristicAdvances({ ...zeroAdvances });
    setCharacteristicAdditions({ ...defaultAdditions });
    setRandomiseCharacteristics(false);
    setSelectedTraits(Array.isArray(tpl.traits?.base) ? [...tpl.traits.base].sort((a, b) => a.localeCompare(b)) : []);
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

  const addTrait = (name) => {
    setSelectedTraits((prev) => {
      if (prev.includes(name)) return prev;
      return [...prev, name].sort((a, b) => a.localeCompare(b));
    });
  };

  const toggleTraitOnBlock = (name) => {
    setSelectedTraits((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name].sort((a, b) => a.localeCompare(b))
    );
  };

  const toPayload = () => {
    const num = (v) => (v === '' || v == null ? undefined : Number(v));
    const talents = form.talents
      ? form.talents.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
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
        wounds: num(form.wounds),
        movement: num(form.movement),
        skills: selectedSkills.length ? selectedSkills : undefined,
        talents: talents.length ? talents : undefined,
        traits: selectedTraits.length ? selectedTraits : undefined,
        armour: form.armour || undefined,
        weapons: form.weapons || undefined,
      };
    }
    const characteristics = {};
    CHAR_ORDER.forEach((k) => {
      const v = form.characteristics[k];
      if (v !== '' && v != null) characteristics[k] = num(v) ?? v;
    });
    return {
      id: existingId || undefined,
      name: form.name || 'Unnamed',
      characteristics: Object.keys(characteristics).length ? characteristics : undefined,
      wounds: num(form.wounds),
      movement: num(form.movement),
      skills: selectedSkills.length ? selectedSkills : undefined,
      talents: talents.length ? talents : undefined,
      traits: selectedTraits.length ? selectedTraits : undefined,
      armour: form.armour || undefined,
      weapons: form.weapons || undefined,
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
                          type="number"
                          min="0"
                          value={characteristicAdvances[key] ?? 0}
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

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gold/90 text-sm uppercase tracking-wider mb-1">Wounds</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.wounds}
                onChange={(e) => update('wounds', e.target.value)}
                placeholder="—"
                className="w-full bg-ink border border-iron/60 rounded px-3 py-2 text-parchment focus:border-gold/60 focus:outline-none"
              />
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
          <div>
            <label className="block text-gold/90 text-sm uppercase tracking-wider mb-1">Armour</label>
            <input
              type="text"
              value={form.armour}
              onChange={(e) => update('armour', e.target.value)}
              placeholder="e.g. Leather jerkin"
              className="w-full bg-ink border border-iron/60 rounded px-3 py-2 text-parchment placeholder-parchment/40 focus:border-gold/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gold/90 text-sm uppercase tracking-wider mb-1">Weapons</label>
            <input
              type="text"
              value={form.weapons}
              onChange={(e) => update('weapons', e.target.value)}
              placeholder="e.g. Sword, shield"
              className="w-full bg-ink border border-iron/60 rounded px-3 py-2 text-parchment placeholder-parchment/40 focus:border-gold/60 focus:outline-none"
            />
          </div>

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
                            type="number"
                            min="0"
                            value={skill.advances}
                            onChange={(e) => updateSkillAdvances(skill.name, e.target.value)}
                            className="w-12 bg-ink border border-iron/70 rounded px-1 py-0.5 text-parchment text-xs focus:border-gold/60 focus:outline-none"
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
                    {template ? 'Add from Optional, Generic or Other below.' : 'Click a trait below to add it.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedTraits.map((name) => (
                      <button
                        type="button"
                        key={name}
                        onClick={() => toggleTraitOnBlock(name)}
                        className="inline-flex items-center gap-1 rounded-full border border-iron/70 bg-ink/80 px-2 py-1 text-xs text-parchment/95 hover:border-blood/70"
                        title="Click to remove"
                      >
                        <span>{name}</span>
                        <span className="text-blood text-xs">×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {template && (
                <>
                  {Array.isArray(template.traits?.base) && template.traits.base.length > 0 && (
                    <div>
                      <p className="text-gold/80 text-xs mb-1">Base (from template)</p>
                      <div className="flex flex-wrap gap-2">
                        {template.traits.base.map((name) => (
                          <span key={name} className="inline-flex rounded-full border border-iron/50 bg-ink/40 px-2 py-0.5 text-xs text-parchment/80">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(template.traits?.optional) && template.traits.optional.length > 0 && (
                    <div>
                      <p className="text-parchment/80 text-xs mb-1">Optional (from template)</p>
                      <div className="max-h-32 overflow-y-auto rounded border border-iron/60 bg-ink/60 p-2 space-y-1">
                        {template.traits.optional.map((name) => (
                          <button
                            type="button"
                            key={name}
                            onClick={() => addTrait(name)}
                            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood/20 text-parchment/90"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(() => {
                    const optionalSet = new Set(Array.isArray(template.traits?.optional) ? template.traits.optional : []);
                    const generic = allTraits.filter((t) => t.generic && !optionalSet.has(t.name));
                    const other = allTraits.filter((t) => !t.generic && !optionalSet.has(t.name));
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
                    {allTraits.length === 0 ? (
                      <p className="text-parchment/60 text-xs">No traits loaded.</p>
                    ) : (
                      allTraits.map((trait) => (
                        <button
                          type="button"
                          key={trait.name}
                          onClick={() => addTrait(trait.name)}
                          className="w-full text-left text-xs px-2 py-1 rounded hover:bg-blood/20 text-parchment/90"
                        >
                          {trait.name}
                        </button>
                      ))
                    )}
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
