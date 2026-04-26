'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import StatBlockCard from './StatBlockCard';
import type {
  ArmourRef,
  CareersRef,
  SkillRef,
  Statblock,
  TraitRef,
  WeaponsRef,
} from '@/lib/types';
import { useGrimMotion } from '@/lib/useMotion';
import {
  armourRefSchema,
  careersRefSchema,
  safeParse,
  skillRefSchema,
  traitRefSchema,
  weaponsRefSchema,
} from '@/lib/apiSchemas';
import { statblockBodySchemaBase } from '@/lib/validateStatblock';
import { z } from 'zod';
import { rememberRosterView } from '@/lib/lastEncounterStorage';
import { getPublicSiteBase } from '@/lib/siteUrl';
import { buildEncounterPlainText, encounterSummaryLine } from '@/lib/encounterSheet';
import MultiViewWoundBar from './MultiViewWoundBar';
import ViewConditionRef from './ViewConditionRef';
import ViewD6Roller from './ViewD6Roller';
import ViewDamageRoller from './ViewDamageRoller';
import ViewDiceRoller from './ViewDiceRoller';
import ViewOpposedD100 from './ViewOpposedD100';
import ViewCurrencyHelper from './ViewCurrencyHelper';
import ViewGmImprov from './ViewGmImprov';
import ViewGmQuickRef from './ViewGmQuickRef';
import ViewHitLocationRoller from './ViewHitLocationRoller';
import ViewCombatLog from './ViewCombatLog';
import ViewSessionBundleCopy from './ViewSessionBundleCopy';
import ViewSessionNotes from './ViewSessionNotes';
import ViewInitiativeList from './ViewInitiativeList';
import { ChevronIcon, EditIcon, LinkIcon, PrinterIcon, ScrollIcon, SkullIcon } from './icons';

const API = '/api';

function parseIds(raw: string | null): string[] {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function StatBlockMultiView() {
  const searchParams = useSearchParams();
  const rosterParam = searchParams.get('roster');
  const packParam = searchParams.get('pack');
  const idsParam = searchParams.get('ids');
  const titleParam = searchParams.get('title');
  const playerMode = searchParams.get('player') === '1';
  const [rosterLabel, setRosterLabel] = useState<string | null>(null);
  const [printLayout, setPrintLayout] = useState<'full' | 'encounter'>('full');
  const idsFromQuery = useMemo(() => parseIds(idsParam), [idsParam]);
  const [resolvedIds, setResolvedIds] = useState<string[] | null>(() => {
    if (rosterParam || packParam) return null;
    return idsFromQuery;
  });
  const { ease } = useGrimMotion();
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const [blocks, setBlocks] = useState<Statblock[]>([]);
  const [skillsRef, setSkillsRef] = useState<SkillRef[]>([]);
  const [traitsRef, setTraitsRef] = useState<TraitRef[]>([]);
  const [weaponsRef, setWeaponsRef] = useState<WeaponsRef | null>(null);
  const [armourRef, setArmourRef] = useState<ArmourRef | null>(null);
  const [careersRef, setCareersRef] = useState<CareersRef | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (rosterParam) {
      fetch(`${API}/encounter-rosters/${encodeURIComponent(rosterParam)}`)
        .then((r) => {
          if (r.status === 404) throw new Error('Saved roster not found');
          if (!r.ok) throw new Error('Could not load roster');
          return r.json();
        })
        .then((data: { ids?: string[]; name?: string }) => {
          setResolvedIds(Array.isArray(data.ids) ? data.ids : []);
          const label =
            typeof data.name === 'string' && data.name.trim() ? data.name.trim() : null;
          setRosterLabel(label);
          rememberRosterView(rosterParam, label ?? rosterParam);
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : 'Roster failed');
          setResolvedIds([]);
        });
      return;
    }
    if (packParam) {
      fetch(`${API}/sharepacks/${encodeURIComponent(packParam)}`)
        .then((r) => {
          if (r.status === 404) throw new Error('Share link not found or expired');
          if (!r.ok) throw new Error('Could not load share link');
          return r.json();
        })
        .then((data: { ids?: string[] }) => {
          setResolvedIds(Array.isArray(data.ids) ? data.ids : []);
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : 'Share link failed');
          setResolvedIds([]);
        });
      return;
    }
    setResolvedIds(idsFromQuery);
  }, [rosterParam, packParam, idsFromQuery]);

  useEffect(() => {
    if (!rosterParam) setRosterLabel(null);
  }, [rosterParam]);

  const currentViewUrl = useMemo(() => {
    const base = getPublicSiteBase();
    const addPlayer = (url: string) => {
      if (!playerMode) return url;
      return url.includes('?') ? `${url}&player=1` : `${url}?player=1`;
    };
    if (typeof window === 'undefined') {
      if (rosterParam) {
        return addPlayer(
          `${base}/view?roster=${encodeURIComponent(rosterParam)}${titleParam ? `&title=${encodeURIComponent(titleParam)}` : ''}`
        );
      }
      if (packParam) return addPlayer(`${base}/view?pack=${encodeURIComponent(packParam)}`);
      if (idsFromQuery.length) {
        return addPlayer(
          `${base}/view?ids=${idsFromQuery.map(encodeURIComponent).join(',')}${titleParam ? `&title=${encodeURIComponent(titleParam)}` : ''}`
        );
      }
      return addPlayer(`${base}/view`);
    }
    return window.location.href;
  }, [rosterParam, packParam, idsFromQuery, playerMode, titleParam]);

  const encounterTitle =
    (titleParam && titleParam.trim()) || rosterLabel || (packParam ? 'Shared pack' : 'Encounter');

  const copyViewLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentViewUrl);
      setCopyHint('Link copied');
      setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint('Copy failed');
      setTimeout(() => setCopyHint(null), 2000);
    }
  }, [currentViewUrl]);

  const copyPlainEncounter = useCallback(async () => {
    const text = buildEncounterPlainText({
      title: encounterTitle,
      blocks,
      traitsRef,
      viewUrl: currentViewUrl,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint('Text copied');
      setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint('Copy failed');
      setTimeout(() => setCopyHint(null), 2000);
    }
  }, [blocks, currentViewUrl, encounterTitle, traitsRef]);

  const copyMarkdown = useCallback(async () => {
    const heading =
      rosterLabel && rosterParam
        ? `## ${rosterLabel.replace(/#/g, '')}\n\n`
        : titleParam?.trim()
          ? `## ${titleParam.trim().replace(/#/g, '')}\n\n`
          : '';
    const q = (name: string, id: string) =>
      `[${name.replace(/]/g, '')}](${getPublicSiteBase()}/statblock/${encodeURIComponent(id)}${
        playerMode ? '?player=1' : ''
      })`;
    const lines = blocks.map((b) => q(b.name || b.id || '?', String(b.id ?? '')));
    const md = (heading + (lines.length ? lines.join('\n') : currentViewUrl)).trim();
    try {
      await navigator.clipboard.writeText(md);
      setCopyHint('Markdown copied');
      setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint('Copy failed');
      setTimeout(() => setCopyHint(null), 2000);
    }
  }, [blocks, currentViewUrl, playerMode, rosterLabel, rosterParam, titleParam]);

  const ids = resolvedIds ?? [];
  const idsKey = ids.join(',');
  const viewKey = useMemo(
    () =>
      idsKey
        .split(',')
        .filter(Boolean)
        .sort()
        .join('\0'),
    [idsKey]
  );

  const playerTogglePath = useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString());
    if (playerMode) {
      sp.delete('player');
    } else {
      sp.set('player', '1');
    }
    const q = sp.toString();
    return q ? `/view?${q}` : '/view';
  }, [searchParams, playerMode]);

  useEffect(() => {
    if (resolvedIds === null) return;
    if (ids.length === 0) {
      setBlocks([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchSkills = fetch(`${API}/skills`).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error('Failed to load skills'))
    );
    const fetchTraits = fetch(`${API}/traits`).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error('Failed to load traits'))
    );
    const fetchWeapons = fetch(`${API}/weapons`).then((r) => (r.ok ? r.json() : null));
    const fetchArmour = fetch(`${API}/armour`).then((r) => (r.ok ? r.json() : null));
    const fetchCareers = fetch(`${API}/careers`).then((r) => (r.ok ? r.json() : null));

    const fetchBlocks = Promise.all(
      ids.map((id) =>
        fetch(`${API}/statblocks/${encodeURIComponent(id)}`).then((r) => {
          if (!r.ok) return Promise.reject(new Error(`Not found: ${id}`));
          return r.json();
        })
      )
    );

    Promise.all([fetchBlocks, fetchSkills, fetchTraits, fetchWeapons, fetchArmour, fetchCareers])
      .then(([blockList, skillsData, traitsData, weaponsData, armourData, careersData]) => {
        const parsedBlocks = Array.isArray(blockList)
          ? blockList
              .map((b) => safeParse(statblockBodySchemaBase.passthrough(), b))
              .filter((b): b is NonNullable<typeof b> => b !== null)
          : [];
        setBlocks(parsedBlocks as Statblock[]);
        setSkillsRef(
          (safeParse(z.array(skillRefSchema), skillsData) as SkillRef[] | null) ?? []
        );
        setTraitsRef(
          (safeParse(z.array(traitRefSchema), traitsData) as TraitRef[] | null) ?? []
        );
        setWeaponsRef((safeParse(weaponsRefSchema, weaponsData) as WeaponsRef | null) ?? null);
        setArmourRef((safeParse(armourRefSchema, armourData) as ArmourRef | null) ?? null);
        setCareersRef((safeParse(careersRefSchema, careersData) as CareersRef | null) ?? null);
      })
      .catch(() => setError('Could not load one or more stat blocks'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, resolvedIds]);

  if (error) {
    return (
      <div className="grim-card p-8 text-center flex flex-col items-center gap-3 border-blood-700/60 max-w-xl mx-auto">
        <SkullIcon className="w-10 h-10 text-blood-400" />
        <p className="text-parchment text-sm">{error}</p>
        <Link href="/" className="grim-btn-ghost">
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" /> Back to bestiary
        </Link>
      </div>
    );
  }

  if (resolvedIds === null && (rosterParam || packParam)) {
    return (
      <div className="grim-card p-12 text-center text-parchment/70 max-w-md mx-auto">
        Loading encounter…
      </div>
    );
  }

  if (resolvedIds !== null && ids.length === 0) {
    return (
      <div className="grim-card p-8 text-center flex flex-col items-center gap-4 max-w-xl mx-auto">
        <ScrollIcon className="w-12 h-12 text-gold-500" />
        <div>
          <h2 className="font-display text-xl text-gold-400 tracking-wide">
            No stat blocks in this view
          </h2>
          <p className="text-parchment/80 mt-1 max-w-md mx-auto text-sm">
            From the bestiary, tick the circles next to entries and choose{' '}
            <strong className="text-gold-400">View together</strong>, save a{' '}
            <strong className="text-gold-400">roster</strong>, or open{' '}
            <code className="text-parchment/95 bg-ink-900/80 border border-iron-700 px-1 py-0.5 rounded font-mono text-xs">
              /view?ids=id1,id2
            </code>{' '}
            or <code className="text-parchment/95 bg-ink-900/80 border border-iron-700 px-1 py-0.5 rounded font-mono text-xs">/view?roster=…</code>.
          </p>
        </div>
        <Link href="/" className="grim-btn-ghost">
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" /> Bestiary
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-6">
        {ids.map((id) => (
          <div key={id} className="grim-card shimmer h-64 p-6">
            <div className="h-6 w-1/2 bg-ink-900/80 rounded mb-3" />
            <div className="h-32 w-full bg-ink-900/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div
        className={
          printLayout === 'encounter'
            ? 'encounter-print-sheet hidden print:block print-only-sheet mb-6 text-parchment'
            : 'encounter-print-sheet hidden print:hidden'
        }
      >
        <h1 className="font-display text-2xl text-ink-900 border-b-2 border-ink-900/80 pb-2 mb-4">
          {encounterTitle}
        </h1>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-ink-900/50 py-2 pr-2 w-[28%]">Name</th>
              <th className="text-left border-b border-ink-900/50 py-2 pr-2 w-16">Init</th>
              <th className="text-left border-b border-ink-900/50 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => {
              const bid = String(block.id ?? '');
              return (
                <tr key={bid} className="align-top break-inside-avoid">
                  <td className="border-b border-ink-300/50 py-2 pr-2 font-medium">{block.name || bid}</td>
                  <td className="border-b border-ink-300/50 py-2 pr-2">
                    <span className="inline-block min-w-[2.5rem] border-b border-dotted border-ink-700 min-h-[1.2em]">&nbsp;</span>
                  </td>
                  <td className="border-b border-ink-300/50 py-2 text-ink-800">{encounterSummaryLine(block)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-ink-600 mt-3">Grim Dudes — WFRP 4e</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-parchment/70 hover:text-gold-400 text-xs uppercase tracking-wider transition-colors duration-fast"
        >
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" /> Bestiary
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {copyHint && (
            <span className="text-[0.65rem] uppercase tracking-wider text-gold-400" role="status">
              {copyHint}
            </span>
          )}
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-parchment/50">
            {blocks.length} {blocks.length === 1 ? 'stat block' : 'stat blocks'}
          </p>
          <div className="hidden sm:flex items-center gap-1 text-[0.6rem] uppercase tracking-wider text-parchment/45 border border-iron-700/80 rounded px-1.5 py-0.5">
            <span>Print</span>
            <button
              type="button"
              className={printLayout === 'full' ? 'text-gold-400' : 'hover:text-parchment/80'}
              onClick={() => setPrintLayout('full')}
            >
              Full
            </button>
            <span className="text-parchment/30">|</span>
            <button
              type="button"
              className={printLayout === 'encounter' ? 'text-gold-400' : 'hover:text-parchment/80'}
              onClick={() => setPrintLayout('encounter')}
            >
              Sheet
            </button>
          </div>
          <Link href={playerTogglePath} className="grim-btn-ghost !py-1.5 !px-2 !text-[0.65rem]">
            {playerMode ? 'GM view' : 'Player view'}
          </Link>
          <button type="button" onClick={copyViewLink} className="grim-btn-ghost" aria-label="Copy view link">
            <LinkIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy link</span>
          </button>
          <button
            type="button"
            onClick={copyPlainEncounter}
            className="grim-btn-ghost"
            aria-label="Copy encounter as plain text"
            title="Names, wounds, move, short note — for chat or scratchpads"
          >
            <ScrollIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Text</span>
          </button>
          <button
            type="button"
            onClick={copyMarkdown}
            className="grim-btn-ghost"
            aria-label="Copy as markdown"
          >
            <ScrollIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MD</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="grim-btn-ghost"
          >
            <PrinterIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.045 } } }}
        className={`grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-6 items-start ${
          printLayout === 'encounter' ? 'print:hidden' : ''
        } statblocks-print-grid`}
      >
        <AnimatePresence>
          {blocks.map((block) => {
            const blockId = String(block.id ?? '');
            return (
              <motion.div
                key={blockId}
                variants={{
                  initial: { opacity: 0, y: 8 },
                  animate: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.24, ease }}
                className="statblock-print-root min-w-0 flex flex-col gap-1"
              >
                {!playerMode && (
                  <MultiViewWoundBar viewKey={viewKey} block={block} traitsRef={traitsRef} dense />
                )}
                <div className="flex flex-wrap justify-end gap-2 print:hidden">
                  {!playerMode && (
                    <>
                      <Link
                        href={`/statblock/${encodeURIComponent(blockId)}`}
                        className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
                      >
                        Full page
                      </Link>
                      <Link
                        href={`/statblock/${encodeURIComponent(blockId)}/edit`}
                        className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
                      >
                        <EditIcon className="w-3 h-3" />
                        Edit
                      </Link>
                    </>
                  )}
                  <Link
                    href={`/statblock/${encodeURIComponent(blockId)}?player=1`}
                    className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
                  >
                    Player
                  </Link>
                </div>
                <StatBlockCard
                  block={block}
                  dense
                  playerMode={playerMode}
                  skillsRef={skillsRef}
                  traitsRef={traitsRef}
                  weaponsRef={weaponsRef}
                  armourRef={armourRef}
                  careersRef={careersRef}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {!playerMode && (
        <div className="print:hidden space-y-3 mt-8 w-full max-w-5xl mx-auto border-t border-iron-800/50 pt-6">
          <ViewInitiativeList viewKey={viewKey} blocks={blocks} />
          <ViewSessionNotes viewKey={viewKey} />
          <ViewCombatLog viewKey={viewKey} />
          <ViewSessionBundleCopy viewKey={viewKey} />
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="space-y-3 min-w-0">
              <ViewDiceRoller historyKey={viewKey} />
              <ViewDamageRoller logKey={viewKey} />
              <ViewD6Roller logKey={viewKey} />
              <ViewOpposedD100 logKey={viewKey} />
              <ViewHitLocationRoller logKey={viewKey} />
              <ViewGmImprov />
              <ViewCurrencyHelper />
            </div>
            <ViewGmQuickRef />
            <ViewConditionRef />
          </div>
        </div>
      )}
    </div>
  );
}
