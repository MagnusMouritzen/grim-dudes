const CHAR_ORDER = ['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'];

export default function StatBlockCard({ block, compact = false }) {
  if (!block) return null;
  const ch = block.characteristics || {};
  const skills = Array.isArray(block.skills) ? block.skills : [];
  const talents = Array.isArray(block.talents) ? block.talents : [];

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
        {skills.length > 0 && (
          <section>
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-2 font-semibold">Skills</h3>
            <p className="text-parchment/95">{skills.join(', ')}</p>
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
