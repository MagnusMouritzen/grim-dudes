'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CHAR_ORDER,
  computeEffectiveStats,
  buildSkillDisplay,
  buildTraitsDisplay,
  buildArmourTable,
  buildWeaponsDisplay,
  buildArmourListDisplay,
  computeHighestStatus,
  buildCareerLevelLabels,
  getCharacteristicValue,
  DEFAULT_SIZE,
} from '@/lib/statblockDerived';
import type {
  ArmourPick,
  ArmourRef,
  CareersRef,
  CharKey,
  SkillRef,
  Statblock,
  TraitRef,
  WeaponsRef,
} from '@/lib/types';
import { useGrimMotion } from '@/lib/useMotion';

type DescribedPillProps = {
  id: string;
  label: string;
  sublabel?: string;
  title?: string;
  description?: string;
  dense?: boolean;
  tipW: string;
  tipWQ?: string;
  className?: string;
};

function DescribedPill({
  id,
  label,
  sublabel,
  title,
  description,
  dense,
  tipW,
  className,
}: DescribedPillProps) {
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const showTip = Boolean(description) && (pinned || hover || focus);
  const { ease, prefersReduced } = useGrimMotion();

  const onClick = useCallback(() => {
    if (!description) return;
    setPinned((p) => !p);
  }, [description]);

  const tipId = `desc-${id}`;

  return (
    <span
      role={description ? 'button' : undefined}
      tabIndex={description ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        description
          ? (e: KeyboardEvent<HTMLSpanElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPinned((p) => !p);
              }
              if (e.key === 'Escape') setPinned(false);
            }
          : undefined
      }
      onMouseEnter={() => description && setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => description && setFocus(true)}
      onBlur={() => setFocus(false)}
      aria-describedby={showTip ? tipId : undefined}
      data-pinned={pinned || undefined}
      className={`grim-pill ${dense ? 'text-[0.7rem]' : 'text-sm'} ${
        description ? 'cursor-pointer' : 'cursor-default'
      } ${className ?? ''}`}
    >
      <span>{label}</span>
      {sublabel ? (
        <span
          className={
            dense
              ? 'ml-0.5 text-gold-400 font-semibold text-[0.65rem] font-mono'
              : 'ml-1 text-gold-400 font-semibold text-xs font-mono'
          }
        >
          {sublabel}
        </span>
      ) : null}
      <AnimatePresence>
        {description && showTip && (
          <motion.span
            id={tipId}
            role="tooltip"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4, scale: 0.98 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 2, scale: 0.98 }}
            transition={{ duration: 0.16, ease }}
            className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 z-30 ${tipW} rounded border border-gold-500/60 bg-ink-950/95 backdrop-blur-sm px-2.5 py-2 text-xs text-parchment shadow-[0_10px_30px_-8px_rgba(0,0,0,0.9)] whitespace-pre-line pointer-events-none`}
          >
            <span
              aria-hidden
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-ink-950 border-l border-t border-gold-500/60"
            />
            <span className="block text-gold-400 font-display tracking-wide text-[0.7rem] mb-1">
              {title || label}
            </span>
            <span className="text-parchment/90">{description}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function SectionHeading({ children, dense }: { children: React.ReactNode; dense?: boolean }) {
  return (
    <h3
      className={`flex items-center gap-2 text-gold-400/90 font-display uppercase tracking-wider font-semibold ${
        dense ? 'text-[0.65rem] mb-1.5' : 'text-xs mb-2.5'
      }`}
    >
      <span aria-hidden className="inline-block w-1 h-3 bg-blood-500 rounded-[1px]" />
      <span>{children}</span>
      <span aria-hidden className="flex-1 h-px bg-gradient-to-r from-gold-700/50 to-transparent" />
    </h3>
  );
}

type StatBlockCardProps = {
  block: Statblock | null | undefined;
  compact?: boolean;
  dense?: boolean;
  /** Player-safe view: name + read-aloud text only (no mechanics). */
  playerMode?: boolean;
  skillsRef?: SkillRef[];
  traitsRef?: TraitRef[];
  weaponsRef?: WeaponsRef | null;
  armourRef?: ArmourRef | null;
  careersRef?: CareersRef | null;
};

export default function StatBlockCard({
  block,
  compact = false,
  dense = false,
  playerMode = false,
  skillsRef,
  traitsRef,
  weaponsRef,
  armourRef,
  careersRef,
}: StatBlockCardProps) {
  if (!block) return null;

  if (playerMode) {
    const read = typeof block.playerNotes === 'string' ? block.playerNotes.trim() : '';
    return (
      <article className="grim-card print:break-inside-avoid border-gold-700/40">
        <div className="fx-card-header px-6 py-4 border-b border-gold-700/50">
          <h2 className="font-display text-2xl text-gold-400 tracking-wide">{block.name || block.id || 'Creature'}</h2>
        </div>
        <div className="p-6">
          {read ? (
            <p className="whitespace-pre-line text-parchment text-base leading-relaxed border-l-2 border-gold-600/70 pl-4">
              {read}
            </p>
          ) : (
            <p className="text-parchment-300/85 text-sm italic">No player-facing description yet.</p>
          )}
        </div>
      </article>
    );
  }
  const talents = Array.isArray(block.talents) ? block.talents : [];
  const { effectiveCh, effectiveMovement, effectiveWounds } = computeEffectiveStats(
    block,
    traitsRef
  );
  const baseCh: Partial<Record<CharKey, number>> = {};
  CHAR_ORDER.forEach((k) => {
    const v = getCharacteristicValue(block, k);
    if (typeof v === 'number') baseCh[k] = v;
  });
  const skillsWithTotals = buildSkillDisplay(block, skillsRef, effectiveCh);
  const traits = buildTraitsDisplay(block, traitsRef);
  const armourIsArray = Array.isArray(block.armour);
  const armourLen = armourIsArray ? (block.armour as ArmourPick[]).length : 0;
  const armourTable =
    armourRef && armourLen > 0 ? buildArmourTable(block, armourRef, effectiveCh) : [];
  const armourListDisplay =
    armourRef && armourLen > 0 ? buildArmourListDisplay(block, armourRef) : [];
  const weaponsObj =
    block.weapons && typeof block.weapons === 'object' ? block.weapons : null;
  const hasStructuredWeapons = Boolean(
    weaponsObj &&
      ((Array.isArray(weaponsObj.melee) && weaponsObj.melee.length > 0) ||
        (Array.isArray(weaponsObj.ranged) && weaponsObj.ranged.length > 0))
  );
  const weaponsDisplay =
    hasStructuredWeapons && weaponsRef
      ? buildWeaponsDisplay(block, weaponsRef, effectiveCh)
      : { melee: [], ranged: [] };
  const highestStatus = computeHighestStatus(block, careersRef);
  const careerLabels = buildCareerLevelLabels(block, careersRef);

  if (compact) {
    return (
      <div className="grim-card grim-card-hover p-4 print:break-inside-avoid">
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <div className="font-display text-gold-400 text-lg tracking-wide truncate">
            {block.name}
          </div>
          {highestStatus && (
            <span className="grim-chip shrink-0">{highestStatus}</span>
          )}
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {CHAR_ORDER.map((key) => {
            const val = effectiveCh[key];
            const base = baseCh[key];
            const modified = val != null && base != null && val !== base;
            return (
              <div
                key={key}
                className={`grim-stat-cell ${modified ? 'grim-stat-cell-modified' : ''}`}
              >
                <div className="text-blood-400/90 text-[0.55rem] font-display tracking-wider">
                  {key}
                </div>
                <div className="text-parchment font-mono font-semibold text-xs tabular-nums">
                  {val ?? '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const sizeLabel = block.size || DEFAULT_SIZE;
  const d = dense;
  const tipW = d ? 'w-52' : 'w-64';
  const tipWQ = d ? 'w-52' : 'w-56';

  return (
    <article
      className={`grim-card print:break-inside-avoid ${
        d ? 'text-[0.8125rem] leading-snug' : ''
      }`}
    >
      <div
        className={`fx-card-header relative overflow-hidden ${
          d ? 'px-3 py-2' : 'px-6 py-3'
        } flex items-baseline justify-between gap-3 border-b border-gold-700/50`}
      >
        <h2
          className={`font-display text-gold-400 tracking-wide ${
            d ? 'text-lg' : 'text-2xl'
          }`}
        >
          {block.name}
        </h2>
        <div className="flex flex-col items-end gap-1 min-w-0">
          {highestStatus && (
            <span className={d ? 'grim-chip text-[0.6rem]' : 'grim-chip'}>
              {highestStatus}
            </span>
          )}
          {careerLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {careerLabels.map((label) => (
                <span
                  key={label}
                  className={`grim-pill ${d ? 'text-[0.6rem] px-1.5' : 'text-[0.7rem]'}`}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={d ? 'p-3 space-y-3' : 'p-6 space-y-6'}>
        {typeof block.playerNotes === 'string' && block.playerNotes.trim() ? (
          <section
            className={
              d
                ? 'rounded border border-gold-600/35 bg-gold-950/20 px-3 py-2.5'
                : 'rounded border border-gold-600/35 bg-gold-950/20 px-4 py-3'
            }
            aria-label="Read aloud"
          >
            <p
              className={`text-gold-400/90 font-display uppercase tracking-wider font-semibold ${
                d ? 'text-[0.6rem] mb-1' : 'text-xs mb-1.5'
              }`}
            >
              Read aloud
            </p>
            <p
              className={`whitespace-pre-line text-parchment/95 ${
                d ? 'text-xs leading-snug' : 'text-sm leading-relaxed'
              }`}
            >
              {block.playerNotes}
            </p>
          </section>
        ) : null}
        <section>
          <SectionHeading dense={d}>Characteristics</SectionHeading>
          <div className={d ? 'grid grid-cols-5 sm:grid-cols-10 gap-1' : 'grid grid-cols-5 sm:grid-cols-10 gap-1.5'}>
            {CHAR_ORDER.map((key) => {
              const val = effectiveCh[key];
              const base = baseCh[key];
              const modified = val != null && base != null && val !== base;
              const delta = modified ? (val as number) - (base as number) : 0;
              return (
                <div
                  key={key}
                  className={`grim-stat-cell ${modified ? 'grim-stat-cell-modified' : ''}`}
                  title={modified ? `Base ${base} · ${delta > 0 ? '+' : ''}${delta} from traits` : undefined}
                >
                  <div
                    className={`text-blood-400/90 font-display tracking-wider ${
                      d ? 'text-[0.55rem]' : 'text-[0.65rem]'
                    }`}
                  >
                    {key}
                  </div>
                  <div
                    className={`text-parchment font-mono font-semibold tabular-nums ${
                      d ? 'text-xs' : 'text-base'
                    }`}
                  >
                    {val ?? '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className={d ? 'grid grid-cols-3 gap-2' : 'grid sm:grid-cols-3 gap-4'}>
          {[
            { label: 'Size', value: sizeLabel, mono: false },
            { label: 'Wounds', value: effectiveWounds, mono: true },
            { label: 'Movement', value: effectiveMovement, mono: true },
          ].map((meta) => (
            <div key={meta.label} className="grim-stat-cell !text-left px-3 py-1.5">
              <div
                className={`text-gold-400/90 font-display uppercase tracking-wider ${
                  d ? 'text-[0.6rem]' : 'text-[0.65rem]'
                }`}
              >
                {meta.label}
              </div>
              <p
                className={`text-parchment font-semibold ${
                  meta.mono ? 'font-mono tabular-nums' : ''
                } ${d ? 'text-sm' : 'text-base'}`}
              >
                {meta.value}
              </p>
            </div>
          ))}
        </div>

        {skillsWithTotals.length > 0 && (
          <section>
            <SectionHeading dense={d}>Skills</SectionHeading>
            <div className={d ? 'flex flex-wrap gap-1' : 'flex flex-wrap gap-1.5'}>
              {skillsWithTotals.map((skill) => (
                <span
                  key={skill.name}
                  className={`grim-pill ${d ? 'text-[0.7rem] px-1.5' : 'text-sm'}`}
                >
                  <span className="text-parchment/95">{skill.name}</span>
                  <span
                    className={`text-gold-400 font-mono tabular-nums font-semibold ${
                      d ? 'text-[0.65rem]' : 'text-xs'
                    }`}
                  >
                    {skill.total}
                  </span>
                </span>
              ))}
            </div>
          </section>
        )}

        {traits.length > 0 && (
          <section>
            <SectionHeading dense={d}>Traits</SectionHeading>
            <div className={d ? 'flex flex-wrap gap-1' : 'flex flex-wrap gap-1.5'}>
              {traits.map((trait) => (
                <DescribedPill
                  key={trait.name + (trait.inputValue || '')}
                  id={`trait-${trait.name}`}
                  label={trait.name}
                  sublabel={trait.inputValue || undefined}
                  title={trait.name}
                  description={trait.description}
                  dense={d}
                  tipW={tipW}
                  tipWQ={tipWQ}
                />
              ))}
            </div>
          </section>
        )}

        {talents.length > 0 && (
          <section>
            <SectionHeading dense={d}>Talents</SectionHeading>
            <p className={d ? 'text-parchment/95 text-xs' : 'text-parchment/95'}>
              {talents.join(', ')}
            </p>
          </section>
        )}

        {(weaponsDisplay.melee.length > 0 || weaponsDisplay.ranged.length > 0) && (
          <section>
            <SectionHeading dense={d}>Weapons</SectionHeading>
            <div className={d ? 'space-y-2' : 'space-y-2.5'}>
              {weaponsDisplay.melee.map((w, i) => (
                <div
                  key={`melee-${i}`}
                  className={`relative rounded border border-stone-700 bg-ink-800/70 ${
                    d ? 'p-2 pl-3' : 'p-3 pl-4'
                  }`}
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded bg-blood-500/80"
                  />
                  <div
                    className={`font-display text-parchment ${
                      d ? 'text-sm' : 'text-base'
                    }`}
                  >
                    {w.name}
                  </div>
                  <div
                    className={`text-parchment/90 mt-0.5 font-mono tabular-nums ${
                      d ? 'text-xs' : 'text-sm'
                    }`}
                  >
                    <span className="text-gold-400/80">DMG</span> {w.totalDamage}
                    <span className="text-stone-500 mx-1.5">·</span>
                    <span className="text-gold-400/80">REACH</span>{' '}
                    <span className="font-body">{w.reach ?? '—'}</span>
                  </div>
                  {w.qualities.length > 0 && (
                    <div className={d ? 'flex flex-wrap gap-0.5 mt-1' : 'flex flex-wrap gap-1 mt-2'}>
                      {w.qualities.map((q) => (
                        <DescribedPill
                          key={q.name}
                          id={`melee-${i}-q-${q.name}`}
                          label={q.name}
                          title={q.name}
                          description={q.description}
                          dense={d}
                          tipW={tipWQ}
                          tipWQ={tipWQ}
                          className="text-[0.65rem]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {weaponsDisplay.ranged.map((w, i) => (
                <div
                  key={`ranged-${i}`}
                  className={`relative rounded border border-stone-700 bg-ink-800/70 ${
                    d ? 'p-2 pl-3' : 'p-3 pl-4'
                  }`}
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded bg-gold-600/80"
                  />
                  <div
                    className={`font-display text-parchment ${
                      d ? 'text-sm' : 'text-base'
                    }`}
                  >
                    {w.name}
                    {w.ammunition ? (
                      <span className="text-parchment/60 text-xs ml-1">({w.ammunition})</span>
                    ) : null}
                  </div>
                  <div
                    className={`text-parchment/90 mt-0.5 font-mono tabular-nums ${
                      d ? 'text-xs' : 'text-sm'
                    }`}
                  >
                    <span className="text-gold-400/80">DMG</span> {w.totalDamage}
                    <span className="text-stone-500 mx-1.5">·</span>
                    <span className="text-gold-400/80">RNG</span> {w.range}
                  </div>
                  {w.qualities.length > 0 && (
                    <div className={d ? 'flex flex-wrap gap-0.5 mt-1' : 'flex flex-wrap gap-1 mt-2'}>
                      {w.qualities.map((q) => (
                        <DescribedPill
                          key={q.name}
                          id={`ranged-${i}-q-${q.name}`}
                          label={q.name}
                          title={q.name}
                          description={q.description}
                          dense={d}
                          tipW={tipWQ}
                          tipWQ={tipWQ}
                          className="text-[0.65rem]"
                        />
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
            <SectionHeading dense={d}>Armour</SectionHeading>
            {armourTable.length > 0 && (
              <div className="rounded overflow-hidden border border-stone-700/70 mb-3">
                <table
                  className={
                    d ? 'w-full text-xs border-collapse' : 'w-full text-sm border-collapse'
                  }
                >
                  <thead>
                    <tr className="bg-ink-900/60 text-gold-400/90">
                      <th
                        scope="col"
                        className="text-left font-display uppercase tracking-wider py-1 px-2 text-[0.65rem]"
                      >
                        Roll
                      </th>
                      <th
                        scope="col"
                        className="text-left font-display uppercase tracking-wider py-1 px-2 text-[0.65rem]"
                      >
                        Location
                      </th>
                      <th
                        scope="col"
                        className="text-left font-display uppercase tracking-wider py-1 px-2 text-[0.65rem]"
                      >
                        Protection
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {armourTable.map((row, idx) => (
                      <tr
                        key={row.location}
                        className={`border-t border-stone-700/60 ${
                          idx % 2 === 0 ? 'bg-ink-800/30' : 'bg-transparent'
                        }`}
                      >
                        <td className="py-1 px-2 text-parchment/80 font-mono tabular-nums">
                          {row.roll}
                        </td>
                        <td className="py-1 px-2 text-parchment/90">{row.location}</td>
                        <td className="py-1 px-2 text-parchment">
                          <span className="font-mono font-semibold tabular-nums text-gold-300">
                            {row.protection}
                          </span>
                          {row.breakdown != null && (
                            <span
                              className={
                                d
                                  ? 'text-parchment/70 text-[0.7rem] ml-1'
                                  : 'text-parchment/70 text-xs ml-2'
                              }
                            >
                              : {row.breakdown}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {armourListDisplay.length > 0 && (
              <div className={d ? 'flex flex-wrap gap-1' : 'flex flex-wrap gap-2'}>
                {armourListDisplay.map((a) => (
                  <div
                    key={a.name}
                    className={`rounded border border-stone-700 bg-ink-800/70 ${
                      d ? 'px-2 py-1.5' : 'px-3 py-2'
                    }`}
                  >
                    <span
                      className={
                        d
                          ? 'font-display text-parchment text-sm tracking-wide'
                          : 'font-display text-parchment tracking-wide'
                      }
                    >
                      {a.name}
                    </span>
                    <span
                      className={`font-mono tabular-nums text-gold-400 ml-1.5 ${
                        d ? 'text-[0.7rem]' : 'text-xs'
                      }`}
                    >
                      {a.aps ?? 0} AP
                    </span>
                    {a.qualities.length > 0 && (
                      <div
                        className={
                          d ? 'flex flex-wrap gap-0.5 mt-1' : 'flex flex-wrap gap-1 mt-1.5'
                        }
                      >
                        {a.qualities.map((q) => (
                          <DescribedPill
                            key={q.name}
                            id={`armour-${a.name}-q-${q.name}`}
                            label={q.name}
                            title={q.name}
                            description={q.description}
                            dense={d}
                            tipW={tipWQ}
                            tipWQ={tipWQ}
                            className="text-[0.65rem]"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {typeof block.notes === 'string' && block.notes.trim() ? (
          <section className="pt-3 border-t border-stone-700/60">
            <SectionHeading dense={d}>Notes</SectionHeading>
            <p
              className={`whitespace-pre-line ${
                d ? 'text-parchment/95 text-xs' : 'text-parchment/95 text-sm'
              }`}
            >
              {block.notes}
            </p>
          </section>
        ) : null}
      </div>
    </article>
  );
}
