const CHAR_ORDER = ['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'];

function normaliseSkills(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.map((s) => {
    if (typeof s === 'string') {
      return { name: s, advances: 0 };
    }
    const name = s.name || s.skill || '';
    const advances = Number.isFinite(s.advances) ? s.advances : 0;
    return { name, advances };
  });
}

function buildSkillDisplay(block, skillsRef) {
  const ch = block.characteristics || {};
  const refMap = new Map(
    (Array.isArray(skillsRef) ? skillsRef : []).map((s) => [s.name, s])
  );
  const normalised = normaliseSkills(block.skills);

  const withTotals = normalised
    .filter((s) => s.name)
    .map((s) => {
      const ref = refMap.get(s.name);
      const charKey = ref?.characteristic;
      const base = charKey && typeof ch[charKey] === 'number' ? ch[charKey] : 0;
      const total = base + (Number.isFinite(s.advances) ? s.advances : 0);
      return { ...s, characteristic: charKey, total };
    });

  withTotals.sort((a, b) => a.name.localeCompare(b.name));
  return withTotals;
}

function buildTraitsDisplay(block, traitsRef) {
  const names = Array.isArray(block.traits) ? block.traits : [];
  const map = new Map(
    (Array.isArray(traitsRef) ? traitsRef : []).map((t) => [t.name, t])
  );
  const items = names
    .filter((n) => typeof n === 'string' && n.trim())
    .map((name) => ({
      name,
      description: map.get(name)?.description || '',
    }));
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

export default function StatBlockCard({ block, compact = false, skillsRef, traitsRef }) {
  if (!block) return null;
  const ch = block.characteristics || {};
  const talents = Array.isArray(block.talents) ? block.talents : [];
  const skillsWithTotals = buildSkillDisplay(block, skillsRef);
  const traits = buildTraitsDisplay(block, traitsRef);

  if (compact) {
    return (
      <div className="rounded border border-iron/60 bg-ink/80 p-4 hover:border-gold/50 transition-colors">
        <div className="font-display text-gold text-lg">{block.name}</div>
        <div className="text-parchment/80 text-sm mt-1">{block.description || '—'}</div>
        <div className="flex flex-wrap gap-2 mt-2 text-xs">
          {CHAR_ORDER.map((k) => (
            <span key={k} className="text-parchment/70">{k} {ch[k] ?? '—'}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <article className="rounded-lg border-2 border-iron/70 bg-[#0f0d0a] shadow-xl overflow-hidden ring-1 ring-gold/20">
      <div className="bg-blood/20 px-6 py-3 border-b border-gold/30">
        <h2 className="font-display text-2xl text-gold tracking-wide">{block.name}</h2>
        {block.description && (
          <p className="text-parchment/90 italic mt-1">{block.description}</p>
        )}
      </div>
      <div className="p-6 space-y-6">
        <section>
          <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-2 font-semibold">Characteristics</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {CHAR_ORDER.map((key) => (
              <div key={key} className="bg-ink/60 rounded px-2 py-1 text-center">
                <div className="text-blood/90 text-xs">{key}</div>
                <div className="text-parchment font-semibold">{ch[key] ?? '—'}</div>
              </div>
            ))}
          </div>
        </section>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <span className="text-gold/90 text-sm uppercase tracking-wider">Wounds</span>
            <p className="text-parchment font-semibold">{block.wounds ?? '—'}</p>
          </div>
          <div>
            <span className="text-gold/90 text-sm uppercase tracking-wider">Movement</span>
            <p className="text-parchment font-semibold">{block.movement ?? '—'}</p>
          </div>
        </div>
        {skillsWithTotals.length > 0 && (
          <section>
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-2 font-semibold">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {skillsWithTotals.map((skill) => (
                <span
                  key={skill.name}
                  className="inline-flex items-center rounded-full border border-iron/70 bg-ink/70 px-2 py-0.5"
                  title={
                    skill.characteristic
                      ? `${skill.name}: ${skill.characteristic} ${ch[skill.characteristic] ?? 0} + Advances ${skill.advances} = ${skill.total}`
                      : `${skill.name}: Advances ${skill.advances} (no linked characteristic)`
                  }
                >
                  <span className="text-parchment/95 mr-1">{skill.name}</span>
                  <span className="text-gold font-semibold text-xs">
                    {skill.total}
                  </span>
                </span>
              ))}
            </div>
          </section>
        )}
        {traits.length > 0 && (
          <section>
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-2 font-semibold">
              Traits
            </h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {traits.map((trait) => (
                <span
                  key={trait.name}
                  className="relative group inline-flex items-center rounded-full border border-iron/70 bg-ink/70 px-2 py-0.5 cursor-help"
                >
                  <span className="text-parchment/95">{trait.name}</span>
                  {trait.description && (
                    <span className="pointer-events-none invisible group-hover:visible absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 w-64 rounded border border-gold/40 bg-[#15110c] px-3 py-2 text-xs text-parchment shadow-lg shadow-black/60">
                      <span className="block text-gold/80 font-semibold mb-1">
                        {trait.name}
                      </span>
                      <span className="text-parchment/90">{trait.description}</span>
                    </span>
                  )}
                </span>
              ))}
            </div>
          </section>
        )}
        {talents.length > 0 && (
          <section>
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-2 font-semibold">Talents</h3>
            <p className="text-parchment/95">{talents.join(', ')}</p>
          </section>
        )}
        {(block.armour || block.weapons) && (
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-iron/40">
            {block.armour && (
              <div>
                <span className="text-gold/90 text-sm uppercase tracking-wider">Armour</span>
                <p className="text-parchment/95">{block.armour}</p>
              </div>
            )}
            {block.weapons && (
              <div>
                <span className="text-gold/90 text-sm uppercase tracking-wider">Weapons</span>
                <p className="text-parchment/95">{block.weapons}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
