import { characteristicBonus, woundsFromSize, DEFAULT_SIZE } from '../lib/statblockUtils';

const CHAR_ORDER = ['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'];

function getCharacteristicValue(block, key) {
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

function normaliseTraits(traits) {
  if (!Array.isArray(traits)) return [];
  return traits.map((t) => {
    if (typeof t === 'string') return { name: t.trim(), inputValue: '' };
    const name = t.name || t.trait || '';
    const inputValue = typeof t.inputValue === 'string' ? t.inputValue : '';
    return { name, inputValue };
  }).filter((t) => t.name);
}

/**
 * Compute effective characteristics, movement, and wounds after applying trait effects.
 * Order: static characteristic modifiers first, then movement, then wounds formula + trait wound bonuses.
 */
function computeEffectiveStats(block, traitsRef) {
  const traitMap = new Map((Array.isArray(traitsRef) ? traitsRef : []).map((t) => [t.name, t]));
  const getChar = (key) => getCharacteristicValue(block, key) ?? 0;

  const effectiveCh = {};
  CHAR_ORDER.forEach((k) => { effectiveCh[k] = getChar(k); });

  let movementDelta = 0;
  const woundBonusFromTraits = [];

  const traitList = normaliseTraits(block.traits);
  traitList.forEach(({ name }) => {
    const ref = traitMap.get(name);
    if (!ref?.effects) return;
    const e = ref.effects;
    if (e.characteristics && typeof e.characteristics === 'object') {
      Object.entries(e.characteristics).forEach(([charKey, delta]) => {
        if (CHAR_ORDER.includes(charKey) && typeof delta === 'number') {
          effectiveCh[charKey] = (effectiveCh[charKey] ?? 0) + delta;
        }
      });
    }
    if (typeof e.movement === 'number') movementDelta += e.movement;
    if (e.wounds && typeof e.wounds === 'object' && e.wounds.addBonus) {
      const charKey = e.wounds.addBonus;
      if (CHAR_ORDER.includes(charKey)) {
        woundBonusFromTraits.push(characteristicBonus(effectiveCh[charKey] ?? 0));
      }
    }
  });

  const getEffectiveChar = (key) => effectiveCh[key] ?? 0;
  const baseWounds = woundsFromSize(block.size, getEffectiveChar);
  const traitWoundBonus = woundBonusFromTraits.reduce((a, b) => a + b, 0);
  const effectiveWounds = baseWounds + traitWoundBonus;

  const baseMovement = typeof block.movement === 'number' ? block.movement : Number(block.movement) || 0;
  const effectiveMovement = baseMovement + movementDelta;

  return { effectiveCh, effectiveMovement: Math.max(0, effectiveMovement), effectiveWounds };
}

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

function buildSkillDisplay(block, skillsRef, effectiveCh = null) {
  const refMap = new Map(
    (Array.isArray(skillsRef) ? skillsRef : []).map((s) => [s.name, s])
  );
  const normalised = normaliseSkills(block.skills);
  const getBase = effectiveCh
    ? (key) => effectiveCh[key] ?? 0
    : (key) => getCharacteristicValue(block, key) ?? 0;

  const withTotals = normalised
    .filter((s) => s.name)
    .map((s) => {
      const ref = refMap.get(s.name);
      const charKey = ref?.characteristic;
      const base = charKey ? getBase(charKey) : 0;
      const total = (typeof base === 'number' ? base : 0) + (Number.isFinite(s.advances) ? s.advances : 0);
      return { ...s, characteristic: charKey, total };
    });

  withTotals.sort((a, b) => a.name.localeCompare(b.name));
  return withTotals;
}

function buildTraitsDisplay(block, traitsRef) {
  const traitList = normaliseTraits(block.traits);
  const map = new Map(
    (Array.isArray(traitsRef) ? traitsRef : []).map((t) => [t.name, t])
  );
  const items = traitList.map(({ name, inputValue }) => {
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

export default function StatBlockCard({ block, compact = false, skillsRef, traitsRef }) {
  if (!block) return null;
  const talents = Array.isArray(block.talents) ? block.talents : [];
  const { effectiveCh, effectiveMovement, effectiveWounds } = computeEffectiveStats(block, traitsRef);
  const skillsWithTotals = buildSkillDisplay(block, skillsRef, effectiveCh);
  const traits = buildTraitsDisplay(block, traitsRef);

  if (compact) {
    return (
      <div className="rounded border border-iron/60 bg-ink/80 p-4 hover:border-gold/50 transition-colors">
        <div className="font-display text-gold text-lg mb-3">{block.name}</div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {CHAR_ORDER.map((key) => (
            <div key={key} className="bg-ink/60 rounded px-2 py-1 text-center">
              <div className="text-blood/90 text-[0.6rem]">{key}</div>
              <div className="text-parchment font-semibold text-xs">{effectiveCh[key] ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sizeLabel = block.size || DEFAULT_SIZE;

  return (
    <article className="relative rounded-lg border-2 border-iron/70 bg-[#0f0d0a] shadow-xl ring-1 ring-gold/20">
      <div className="bg-blood/20 px-6 py-3 border-b border-gold/30">
        <h2 className="font-display text-2xl text-gold tracking-wide">{block.name}</h2>
      </div>
      <div className="p-6 space-y-6">
        <section>
          <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-2 font-semibold">Characteristics</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {CHAR_ORDER.map((key) => (
              <div key={key} className="bg-ink/60 rounded px-2 py-1 text-center">
                <div className="text-blood/90 text-xs">{key}</div>
                <div className="text-parchment font-semibold">{effectiveCh[key] ?? '—'}</div>
              </div>
            ))}
          </div>
        </section>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <span className="text-gold/90 text-sm uppercase tracking-wider">Size</span>
            <p className="text-parchment font-semibold">{sizeLabel}</p>
          </div>
          <div>
            <span className="text-gold/90 text-sm uppercase tracking-wider">Wounds</span>
            <p className="text-parchment font-semibold">{effectiveWounds}</p>
          </div>
          <div>
            <span className="text-gold/90 text-sm uppercase tracking-wider">Movement</span>
            <p className="text-parchment font-semibold">{effectiveMovement}</p>
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
                  key={trait.name + (trait.inputValue || '')}
                  className="relative group inline-flex items-center rounded-full border border-iron/70 bg-ink/70 px-2 py-0.5 cursor-help"
                >
                  <span className="text-parchment/95">{trait.name}</span>
                  {trait.inputValue ? (
                    <span className="ml-1 text-gold font-semibold text-xs">{trait.inputValue}</span>
                  ) : null}
                  {trait.description ? (
                    <span className="pointer-events-none invisible group-hover:visible absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 w-64 rounded border border-gold/40 bg-[#15110c] px-3 py-2 text-xs text-parchment shadow-lg shadow-black/60 whitespace-pre-line">
                      <span className="block text-gold/80 font-semibold mb-1">
                        {trait.name}
                      </span>
                      <span className="text-parchment/90">{trait.description}</span>
                    </span>
                  ) : null}
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
