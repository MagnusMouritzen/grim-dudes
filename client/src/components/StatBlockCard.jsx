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

const ARMOUR_LOCATIONS = [
  { roll: '01–09', location: 'Head' },
  { roll: '10–24', location: 'Left Arm' },
  { roll: '25–44', location: 'Right Arm' },
  { roll: '45–79', location: 'Body' },
  { roll: '80–89', location: 'Left Leg' },
  { roll: '90–00', location: 'Right Leg' },
];

function locationToCovered(location) {
  if (location === 'Arms') return ['Left Arm', 'Right Arm'];
  if (location === 'Legs') return ['Left Leg', 'Right Leg'];
  return [location];
}

function buildArmourTable(block, armourRef, effectiveCh) {
  const armourList = Array.isArray(block.armour) ? block.armour : [];
  const categories = armourRef?.armour?.categories || [];
  const itemsByKey = new Map();
  categories.forEach((cat) => {
    (cat.items || []).forEach((item) => {
      itemsByKey.set(`${cat.name}:${item.name}`, { ...item, category: cat.name });
    });
  });
  const selectedItems = armourList
    .map((a) => itemsByKey.get(`${a.category}:${a.name}`))
    .filter(Boolean);
  const TB = characteristicBonus(effectiveCh?.T ?? getCharacteristicValue(block, 'T') ?? 0);
  const contributorsByLocation = {};
  ARMOUR_LOCATIONS.forEach(({ location }) => { contributorsByLocation[location] = []; });
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

function buildWeaponsDisplay(block, weaponsRef, effectiveCh) {
  const weapons = block.weapons;
  if (!weaponsRef || typeof weapons !== 'object') return { melee: [], ranged: [] };
  const qfMap = new Map((weaponsRef.qualitiesAndFlaws || []).map((q) => [q.name, q.description]));
  const getSB = () => characteristicBonus(effectiveCh?.S ?? getCharacteristicValue(block, 'S') ?? 0);

  const meleeCats = weaponsRef.melee?.categories || [];
  const meleeByKey = new Map();
  meleeCats.forEach((cat) => {
    (cat.weapons || []).forEach((w) => meleeByKey.set(`${cat.name}:${w.name}`, { ...w, category: cat.name }));
  });
  const rangedCats = weaponsRef.ranged?.categories || [];
  const rangedByKey = new Map();
  rangedCats.forEach((cat) => {
    (cat.weapons || []).forEach((w) => rangedByKey.set(`${cat.name}:${w.name}`, { ...w, category: cat.name }));
  });
  const ammoCats = weaponsRef.ammunition?.categories || [];
  const ammoByKey = new Map();
  ammoCats.forEach((cat) => {
    (cat.ammunition || []).forEach((a) => ammoByKey.set(`${cat.name}:${a.name}`, { ...a, category: cat.name }));
  });

  const meleeList = (Array.isArray(weapons.melee) ? weapons.melee : []).map((sel) => {
    const w = meleeByKey.get(`${sel.category}:${sel.name}`);
    if (!w) return null;
    const totalDamage = (w.damage || 0) + (w.sbDamage ? getSB() : 0);
    const qualities = (w.qualitiesAndFlaws || []).map((name) => ({ name, description: qfMap.get(name) || '' }));
    return { name: w.name, totalDamage, reach: w.reach, qualities };
  }).filter(Boolean);

  const rangedList = (Array.isArray(weapons.ranged) ? weapons.ranged : []).map((sel) => {
    const w = rangedByKey.get(`${sel.category}:${sel.name}`);
    const ammo = sel.ammunition ? ammoByKey.get(`${sel.category}:${sel.ammunition}`) : null;
    if (!w) return null;
    let totalDamage = (w.damage || 0) + (w.sbDamage ? getSB() : 0);
    if (ammo) totalDamage += ammo.damage || 0;
    const qNames = [...new Set([...(w.qualitiesAndFlaws || []), ...(ammo?.qualitiesAndFlaws || [])])];
    const qualities = qNames.map((name) => ({ name, description: qfMap.get(name) || '' }));
    const rangeText = ammo ? `${w.range ?? '—'} / ${ammo.range ?? '—'}` : String(w.range ?? '—');
    return { name: w.name, ammunition: ammo?.name, totalDamage, range: rangeText, qualities };
  }).filter(Boolean);

  return { melee: meleeList, ranged: rangedList };
}

function buildArmourListDisplay(block, armourRef) {
  const armourList = Array.isArray(block.armour) ? block.armour : [];
  const categories = armourRef?.armour?.categories || [];
  const qfMap = new Map((armourRef?.qualitiesAndFlaws || []).map((q) => [q.name, q.description]));
  const itemsByKey = new Map();
  categories.forEach((cat) => {
    (cat.items || []).forEach((item) => {
      itemsByKey.set(`${cat.name}:${item.name}`, { ...item, category: cat.name });
    });
  });
  return armourList
    .map((a) => itemsByKey.get(`${a.category}:${a.name}`))
    .filter(Boolean)
    .map((item) => ({
      name: item.name,
      aps: item.aps,
      qualities: (item.qualitiesAndFlaws || []).map((name) => ({ name, description: qfMap.get(name) || '' })),
    }));
}

export default function StatBlockCard({ block, compact = false, skillsRef, traitsRef, weaponsRef, armourRef }) {
  if (!block) return null;
  const talents = Array.isArray(block.talents) ? block.talents : [];
  const { effectiveCh, effectiveMovement, effectiveWounds } = computeEffectiveStats(block, traitsRef);
  const skillsWithTotals = buildSkillDisplay(block, skillsRef, effectiveCh);
  const traits = buildTraitsDisplay(block, traitsRef);
  const armourTable = (armourRef && (Array.isArray(block.armour) ? block.armour.length > 0 : false))
    ? buildArmourTable(block, armourRef, effectiveCh)
    : [];
  const armourListDisplay = (armourRef && Array.isArray(block.armour) && block.armour.length > 0)
    ? buildArmourListDisplay(block, armourRef)
    : [];
  const hasStructuredWeapons = block.weapons && typeof block.weapons === 'object' && ((Array.isArray(block.weapons.melee) && block.weapons.melee.length > 0) || (Array.isArray(block.weapons.ranged) && block.weapons.ranged.length > 0));
  const weaponsDisplay = hasStructuredWeapons && weaponsRef ? buildWeaponsDisplay(block, weaponsRef, effectiveCh) : { melee: [], ranged: [] };

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
        {(weaponsDisplay.melee.length > 0 || weaponsDisplay.ranged.length > 0) && (
          <section>
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-2 font-semibold">Weapons</h3>
            <div className="space-y-3">
              {weaponsDisplay.melee.map((w, i) => (
                <div key={`melee-${i}`} className="rounded border border-iron/60 bg-ink/60 p-3">
                  <div className="font-semibold text-parchment">{w.name}</div>
                  <div className="text-sm text-parchment/90 mt-1">
                    Damage {w.totalDamage} · Reach {w.reach ?? '—'}
                  </div>
                  {w.qualities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {w.qualities.map((q) => (
                        <span key={q.name} className="relative group inline-flex items-center rounded-full border border-iron/70 bg-ink/70 px-2 py-0.5 text-xs cursor-help">
                          {q.name}
                          {q.description ? (
                            <span className="pointer-events-none invisible group-hover:visible absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 w-56 rounded border border-gold/40 bg-[#15110c] px-2 py-1.5 text-xs text-parchment shadow-lg whitespace-pre-line">
                              <span className="block text-gold/80 font-semibold">{q.name}</span>
                              {q.description}
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {weaponsDisplay.ranged.map((w, i) => (
                <div key={`ranged-${i}`} className="rounded border border-iron/60 bg-ink/60 p-3">
                  <div className="font-semibold text-parchment">{w.name}{w.ammunition ? ` (${w.ammunition})` : ''}</div>
                  <div className="text-sm text-parchment/90 mt-1">
                    Damage {w.totalDamage} · Range {w.range}
                  </div>
                  {w.qualities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {w.qualities.map((q) => (
                        <span key={q.name} className="relative group inline-flex items-center rounded-full border border-iron/70 bg-ink/70 px-2 py-0.5 text-xs cursor-help">
                          {q.name}
                          {q.description ? (
                            <span className="pointer-events-none invisible group-hover:visible absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 w-56 rounded border border-gold/40 bg-[#15110c] px-2 py-1.5 text-xs text-parchment shadow-lg whitespace-pre-line">
                              <span className="block text-gold/80 font-semibold">{q.name}</span>
                              {q.description}
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
        {(armourTable.length > 0 || armourListDisplay.length > 0) && (
          <section>
            <h3 className="text-gold/90 text-sm uppercase tracking-wider mb-2 font-semibold">Armour</h3>
            {armourTable.length > 0 && (
              <table className="w-full text-sm border-collapse mb-4">
                <thead>
                  <tr className="border-b border-iron/60">
                    <th className="text-left text-gold/90 py-1 pr-2">Roll</th>
                    <th className="text-left text-gold/90 py-1 pr-2">Location</th>
                    <th className="text-left text-gold/90 py-1">Protection</th>
                  </tr>
                </thead>
                <tbody>
                  {armourTable.map((row) => (
                    <tr key={row.location} className="border-b border-iron/40">
                      <td className="text-parchment/90 py-1 pr-2">{row.roll}</td>
                      <td className="text-parchment/90 py-1 pr-2">{row.location}</td>
                      <td className="text-parchment">
                        <span className="font-semibold">{row.protection}</span>
                        {row.breakdown != null && (
                          <span className="text-parchment/80 text-sm ml-1">
                            : {row.breakdown}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {armourListDisplay.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {armourListDisplay.map((a) => (
                  <div key={a.name} className="rounded border border-iron/60 bg-ink/60 px-3 py-2">
                    <span className="text-parchment font-semibold">{a.name}</span>
                    <span className="text-parchment/70 text-sm ml-1">({a.aps} AP)</span>
                    {a.qualities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {a.qualities.map((q) => (
                          <span key={q.name} className="relative group inline-flex items-center rounded-full border border-iron/70 bg-ink/70 px-2 py-0.5 text-xs cursor-help">
                            {q.name}
                            {q.description ? (
                              <span className="pointer-events-none invisible group-hover:visible absolute left-1/2 top-full mt-2 -translate-x-1/2 z-20 w-56 rounded border border-gold/40 bg-[#15110c] px-2 py-1.5 text-xs text-parchment shadow-lg whitespace-pre-line">
                                <span className="block text-gold/80 font-semibold">{q.name}</span>
                                {q.description}
                              </span>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        {((typeof block.weapons === 'string' && block.weapons) || (typeof block.armour === 'string' && block.armour)) ? (
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-iron/40">
            {typeof block.armour === 'string' && block.armour && (
              <div>
                <span className="text-gold/90 text-sm uppercase tracking-wider">Armour</span>
                <p className="text-parchment/95">{block.armour}</p>
              </div>
            )}
            {typeof block.weapons === 'string' && block.weapons && (
              <div>
                <span className="text-gold/90 text-sm uppercase tracking-wider">Weapons</span>
                <p className="text-parchment/95">{block.weapons}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}
