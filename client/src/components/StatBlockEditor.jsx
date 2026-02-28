import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = '/api';
const CHAR_ORDER = ['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'];

const emptyCharacteristics = Object.fromEntries(CHAR_ORDER.map((k) => [k, '']));

export default function StatBlockEditor() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [allTraits, setAllTraits] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
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
    ])
      .then(([skills, traits]) => {
        const sortedSkills = Array.isArray(skills)
          ? [...skills].sort((a, b) => a.name.localeCompare(b.name))
          : [];
        const sortedTraits = Array.isArray(traits)
          ? [...traits].sort((a, b) => a.name.localeCompare(b.name))
          : [];
        setAllSkills(sortedSkills);
        setAllTraits(sortedTraits);
      })
      .catch(() => {
        // fail silently; editor will still work without reference data
      });
  }, []);

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
    const characteristics = {};
    CHAR_ORDER.forEach((k) => {
      const v = form.characteristics[k];
      if (v !== '' && v != null) characteristics[k] = num(v) ?? v;
    });
    return {
      name: form.name || 'Unnamed',
      description: form.description || undefined,
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
      <Link to="/" className="text-parchment/80 hover:text-parchment text-sm mb-4 inline-block">← Bestiary</Link>
      <h1 className="font-display text-3xl text-gold mb-6 tracking-wide">New Stat Block</h1>

      <div className="rounded-lg border-2 border-iron/70 bg-[#0f0d0a] p-6 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] lg:gap-8">
        <div className="space-y-6">
          {error && (
            <div className="rounded border border-blood/60 bg-blood/10 p-3 text-parchment text-sm">
              {error}
            </div>
          )}

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
          <div>
            <label className="block text-gold/90 text-sm uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Short flavour text"
              rows={2}
              className="w-full bg-ink border border-iron/60 rounded px-3 py-2 text-parchment placeholder-parchment/40 focus:border-gold/60 focus:outline-none resize-y"
            />
          </div>

          <section>
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-3 font-semibold">Characteristics</h3>
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
                    Click a trait below to add it.
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
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
