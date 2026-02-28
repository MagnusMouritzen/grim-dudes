import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = '/api';
const CHAR_ORDER = ['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'];

const emptyCharacteristics = Object.fromEntries(CHAR_ORDER.map((k) => [k, '']));

export default function StatBlockEditor() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    characteristics: { ...emptyCharacteristics },
    wounds: '',
    movement: '',
    skills: '',
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

  const toPayload = () => {
    const num = (v) => (v === '' || v == null ? undefined : Number(v));
    const skills = form.skills
      ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
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
      skills: skills.length ? skills : undefined,
      talents: talents.length ? talents : undefined,
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

      <div className="rounded-lg border-2 border-iron/70 bg-[#0f0d0a] p-6 space-y-6">
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
          <label className="block text-gold/90 text-sm uppercase tracking-wider mb-1">Skills (comma-separated)</label>
          <input
            type="text"
            value={form.skills}
            onChange={(e) => update('skills', e.target.value)}
            placeholder="e.g. Athletics, Dodge, Melee (Basic)"
            className="w-full bg-ink border border-iron/60 rounded px-3 py-2 text-parchment placeholder-parchment/40 focus:border-gold/60 focus:outline-none"
          />
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
    </div>
  );
}
