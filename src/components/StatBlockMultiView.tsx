'use client';

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
  useRef,
} from 'react';
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
import { rememberIdsView, rememberPackView, rememberRosterView } from '@/lib/lastEncounterStorage';
import { getPublicSiteBase } from '@/lib/siteUrl';
import { buildEncounterPlainText, encounterSummaryLine } from '@/lib/encounterSheet';
import MultiViewWoundBar from './MultiViewWoundBar';
import ViewConditionRef from './ViewConditionRef';
import ViewD6Roller from './ViewD6Roller';
import ViewDamageRoller from './ViewDamageRoller';
import ViewDiceRoller from './ViewDiceRoller';
import ViewOpposedD100 from './ViewOpposedD100';
import ViewCurrencyHelper from './ViewCurrencyHelper';
import ViewEncounterTables from './ViewEncounterTables';
import ViewGmImprov from './ViewGmImprov';
import ViewGmQuickRef from './ViewGmQuickRef';
import ViewHitLocationRoller from './ViewHitLocationRoller';
import ViewCombatLog from './ViewCombatLog';
import ViewSessionBundleCopy from './ViewSessionBundleCopy';
import ViewSessionNotes from './ViewSessionNotes';
import ViewInitiativeList from './ViewInitiativeList';
import {
  ChevronIcon,
  EditIcon,
  LinkIcon,
  PrinterIcon,
  ScrollIcon,
  SearchIcon,
  SkullIcon,
} from './icons';

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
  const [cardFilter, setCardFilter] = useState('');
  const cardFilterInputRef = useRef<HTMLInputElement>(null);
  const deferredFilter = useDeferredValue(cardFilter.trim().toLowerCase());

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
          if (packParam) rememberPackView(packParam);
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

  useEffect(() => {
    if (rosterParam || packParam) return;
    if (error) return;
    if (loading) return;
    if (idsFromQuery.length === 0) return;
    const title = titleParam?.trim() || null;
    rememberIdsView(idsFromQuery, title);
  }, [rosterParam, packParam, error, loading, idsFromQuery, titleParam]);

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

  const sessionEncounterPreamble = useMemo(
    () =>
      buildEncounterPlainText({
        title: encounterTitle,
        blocks,
        traitsRef,
        viewUrl: currentViewUrl,
      }),
    [blocks, currentViewUrl, encounterTitle, traitsRef]
  );

  const filteredBlocks = useMemo(() => {
    if (!deferredFilter) return blocks;
    return blocks.filter((b) => {
      const name = (b.name || '').toLowerCase();
      const id = String(b.id ?? '').toLowerCase();
      return name.includes(deferredFilter) || id.includes(deferredFilter);
    });
  }, [blocks, deferredFilter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      if (playerMode || blocks.length < 2) return;
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      e.preventDefault();
      cardFilterInputRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [playerMode, blocks.length]);

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
      <div className="grim-page max-w-xl mx-auto">
        <div className="grim-card p-8 text-center flex flex-col items-center gap-3 border-blood-700/60 w-full">
          <SkullIcon className="w-10 h-10 text-blood-400" />
          <p className="text-parchment text-sm">{error}</p>
          <Link href="/" className="grim-btn-ghost">
            <ChevronIcon className="w-3.5 h-3.5 rotate-180" /> Back to bestiary
          </Link>
        </div>
      </div>
    );
  }

  if (resolvedIds === null && (rosterParam || packParam)) {
    return (
      <div className="grim-page max-w-md mx-auto">
        <div className="grim-card p-12 text-center text-parchment-200/90 w-full motion-safe:animate-fade-in">
          Loading encounter…
        </div>
      </div>
    );
  }

  if (resolvedIds !== null && ids.length === 0) {
    return (
      <div className="grim-page max-w-xl mx-auto">
        <div className="grim-card p-8 sm:p-10 text-left flex flex-col gap-5 w-full">
          <div className="text-center">
            <ScrollIcon className="w-12 h-12 text-gold-500 mx-auto" aria-hidden="true" />
            <p className="grim-label mt-3">Encounter</p>
            <h1 className="font-display text-xl sm:text-2xl text-gold-300 tracking-wide shadow-textGold">
              Add creatures to this view
            </h1>
            <p className="text-parchment-200/90 mt-2 max-w-md mx-auto text-sm">
              This page is for the table: once loaded, you get stat blocks, initiative, the combat log, and
              other tools together. Start from the bestiary, or use a link someone sent you.
            </p>
          </div>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-parchment/85 max-w-md mx-auto">
            <li>
              <span className="text-parchment">Pick entries on the </span>
              <Link href="/" className="text-gold-400 hover:underline">
                bestiary
              </Link>
              <span className="text-parchment">, then </span>
              <strong className="text-gold-400 font-normal">View together</strong>
              <span className="text-parchment"> (or </span>
              <strong className="text-gold-400 font-normal">Save roster</strong>
              <span className="text-parchment"> for a bookmarkable link).</span>
            </li>
            <li>
              <span className="text-parchment">Open a </span>
              <strong className="text-gold-400 font-normal">saved encounter roster</strong>
              <span className="text-parchment"> from the bestiary&rsquo;s roster list, if you have any.</span>
            </li>
            <li>
              <span className="text-parchment">Or paste a URL with </span>
              <code className="text-parchment/95 bg-ink-900/80 border border-stone-600 px-1 py-0.5 rounded font-mono text-xs">
                ?ids=…
              </code>
              <span className="text-parchment">, </span>
              <code className="text-parchment/95 bg-ink-900/80 border border-stone-600 px-1 py-0.5 rounded font-mono text-xs">
                ?roster=…
              </code>
              <span className="text-parchment">, or a share </span>
              <code className="text-parchment/95 bg-ink-900/80 border border-stone-600 px-1 py-0.5 rounded font-mono text-xs">
                ?pack=…
              </code>
              <span className="text-parchment">.</span>
            </li>
          </ol>
          <p className="text-center text-[0.7rem] text-parchment-300/80 max-w-sm mx-auto">
            If you&rsquo;ve been here before, use <strong className="text-parchment-200/90 font-medium">Last: …</strong>{' '}
            in the header to resume.
          </p>
          <div className="flex justify-center pt-1">
            <Link href="/" className="grim-btn-primary text-center justify-center w-full sm:w-auto">
              Open bestiary
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grim-page">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-6 w-full">
          {ids.map((id, i) => (
            <div
              key={id}
              className="grim-card shimmer h-64 p-6 motion-safe:animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="h-6 w-1/2 rounded mb-3 bg-ink-900/85 ring-1 ring-stone-800/35" />
              <div className="h-32 w-full rounded bg-ink-900/70 ring-1 ring-stone-800/30" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grim-page">
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

      <header className="print:hidden mb-4 min-w-0 space-y-1">
        <p className="grim-label">Encounter</p>
        <h1 className="font-display text-2xl sm:text-3xl text-gold-300 tracking-wide shadow-textGold break-words pr-2">
          {encounterTitle}
        </h1>
        {playerMode ? (
          <p className="text-parchment-200/85 text-sm max-w-2xl">
            Player view: stat cards only. Ask the GM to disable player view to show tools on their
            screen.
          </p>
        ) : (
          <p className="text-parchment-200/85 text-sm max-w-2xl">
            Stat blocks and wounds above; session tools&mdash;initiative, notes, log, and dice&mdash;below
            the grid.
          </p>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 print:hidden">
        <Link href="/" className="grim-back-link">
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" /> Bestiary
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {copyHint && (
            <span className="text-[0.65rem] uppercase tracking-wider text-gold-300" role="status">
              {copyHint}
            </span>
          )}
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-parchment-300/70">
            {blocks.length} {blocks.length === 1 ? 'stat block' : 'stat blocks'}
          </p>
          <div className="hidden sm:flex items-center gap-1 text-[0.6rem] uppercase tracking-wider text-parchment-300/80 border border-stone-600/85 rounded px-1.5 py-0.5 transition-colors duration-base ease-grim hover:border-gold-700/40">
            <span>Print</span>
            <button
              type="button"
              className={
                printLayout === 'full'
                  ? 'text-gold-300 font-semibold'
                  : 'hover:text-parchment-50 transition-colors duration-base ease-grim'
              }
              onClick={() => setPrintLayout('full')}
            >
              Full
            </button>
            <span className="text-parchment-400/40">|</span>
            <button
              type="button"
              className={
                printLayout === 'encounter'
                  ? 'text-gold-300 font-semibold'
                  : 'hover:text-parchment-50 transition-colors duration-base ease-grim'
              }
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

      {!playerMode && blocks.length >= 2 && (
        <div className="mb-4 print:hidden w-full">
          <div className="grim-page max-w-sm">
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <label
                htmlFor="encounter-card-filter"
                className="text-[0.6rem] uppercase text-parchment-300/80"
              >
                Filter cards
              </label>
              <span className="text-[0.6rem] text-parchment-400/55 hidden sm:inline">press /</span>
            </div>
            <div className="relative w-full">
              <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-parchment-400/55" />
              <input
                ref={cardFilterInputRef}
                id="encounter-card-filter"
                type="search"
                value={cardFilter}
                onChange={(e) => setCardFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setCardFilter('');
                  }
                }}
                placeholder="Name or id…"
                className="grim-input !pl-8 !py-1.5 text-sm w-full"
                autoComplete="off"
                aria-describedby="encounter-card-filter-hint"
              />
            </div>
            <p className="sr-only" id="encounter-card-filter-hint">
              Focus with slash. Escape clears. Does not change initiative or tools below.
            </p>
            {cardFilter.trim() ? (
              <span className="text-[0.65rem] text-parchment-300/82 font-mono tabular-nums" aria-live="polite">
                {filteredBlocks.length}/{blocks.length} shown
              </span>
            ) : null}
          </div>
        </div>
      )}

      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.045 } } }}
        className={`grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-6 items-start ${
          printLayout === 'encounter' ? 'print:hidden' : ''
        } statblocks-print-grid`}
      >
        {cardFilter.trim() && filteredBlocks.length === 0 ? (
          <p className="text-parchment-200/88 text-sm col-span-full text-center py-6 border border-stone-800/55 rounded border-dashed">
            No stat blocks match &ldquo;{cardFilter.trim()}&rdquo;. Clear the field to see everyone.
          </p>
        ) : (
          <AnimatePresence>
            {filteredBlocks.map((block) => {
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
        )}
      </motion.div>

      {!playerMode && (
        <section
          className="print:hidden space-y-3 mt-8 w-full border-t border-stone-800/55 pt-6"
          aria-labelledby="encounter-table-tools-heading"
        >
          <h2
            id="encounter-table-tools-heading"
            className="font-display text-lg sm:text-xl text-gold-400/95 tracking-wide"
          >
            Session &amp; table tools
          </h2>
          <p className="text-parchment-200/85 text-sm -mt-0.5 mb-1 max-w-2xl">
            Run order, notes, the combat log, and dice live here&mdash;below the stat blocks, so the
            page reads top to bottom: <span className="text-parchment-50/95 font-medium">creatures &rarr; tools</span>.
          </p>
          <ViewInitiativeList viewKey={viewKey} blocks={blocks} />
          <ViewSessionNotes viewKey={viewKey} />
          <ViewCombatLog viewKey={viewKey} />
          <ViewSessionBundleCopy viewKey={viewKey} encounterPreamble={sessionEncounterPreamble} />
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="space-y-3 min-w-0">
              <ViewDiceRoller historyKey={viewKey} />
              <ViewDamageRoller logKey={viewKey} />
              <ViewD6Roller logKey={viewKey} />
              <ViewOpposedD100 logKey={viewKey} />
              <ViewHitLocationRoller logKey={viewKey} />
              <ViewEncounterTables logKey={viewKey} />
              <ViewGmImprov />
              <ViewCurrencyHelper />
            </div>
            <ViewGmQuickRef />
            <ViewConditionRef />
          </div>
        </section>
      )}
    </div>
  );
}
