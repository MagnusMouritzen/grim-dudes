'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import StatBlockCard from './StatBlockCard';
import MultiViewWoundBar from './MultiViewWoundBar';
import ViewD6Roller from './ViewD6Roller';
import ViewDamageRoller from './ViewDamageRoller';
import ViewDiceRoller from './ViewDiceRoller';
import ViewCombatLog from './ViewCombatLog';
import ViewCurrencyHelper from './ViewCurrencyHelper';
import ViewHitLocationRoller from './ViewHitLocationRoller';
import ViewOpposedD100 from './ViewOpposedD100';
import ViewSceneTimeChips from './ViewSceneTimeChips';
import ViewSessionBundleCopy from './ViewSessionBundleCopy';
import ViewSessionNotes from './ViewSessionNotes';
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
import { deleteStatblockAction } from '@/app-actions/statblocks';
import { buildStatblockPlainText } from '@/lib/encounterSheet';
import { getPublicSiteBase } from '@/lib/siteUrl';
import { postDuplicateStatblock } from '@/lib/duplicateStatblockClient';
import {
  ChevronIcon,
  EditIcon,
  LinkIcon,
  PlusIcon,
  PrinterIcon,
  ScrollIcon,
  SkullIcon,
  TrashIcon,
} from './icons';

const API = '/api';

function StatBlockViewInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const searchParams = useSearchParams();
  const playerMode = searchParams.get('player') === '1';
  const router = useRouter();
  const [block, setBlock] = useState<Statblock | null>(null);
  const [skillsRef, setSkillsRef] = useState<SkillRef[]>([]);
  const [traitsRef, setTraitsRef] = useState<TraitRef[]>([]);
  const [weaponsRef, setWeaponsRef] = useState<WeaponsRef | null>(null);
  const [armourRef, setArmourRef] = useState<ArmourRef | null>(null);
  const [careersRef, setCareersRef] = useState<CareersRef | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [dupBusy, setDupBusy] = useState(false);
  const confirmRef = useRef<HTMLDivElement | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { rise, ease } = useGrimMotion();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const fetchBlock = fetch(`${API}/statblocks/${encodeURIComponent(id)}`).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error('Not found'))
    );
    const fetchSkills = fetch(`${API}/skills`).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error('Failed to load skills'))
    );
    const fetchTraits = fetch(`${API}/traits`).then((r) =>
      r.ok ? r.json() : Promise.reject(new Error('Failed to load traits'))
    );
    const fetchWeapons = fetch(`${API}/weapons`).then((r) => (r.ok ? r.json() : null));
    const fetchArmour = fetch(`${API}/armour`).then((r) => (r.ok ? r.json() : null));
    const fetchCareers = fetch(`${API}/careers`).then((r) => (r.ok ? r.json() : null));

    Promise.all([fetchBlock, fetchSkills, fetchTraits, fetchWeapons, fetchArmour, fetchCareers])
      .then(([blockData, skillsData, traitsData, weaponsData, armourData, careersData]) => {
        const parsedBlock = safeParse(statblockBodySchemaBase.passthrough(), blockData);
        setBlock((parsedBlock as Statblock | null) ?? null);
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
      .catch(() => setError('Could not load this stat block'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        setConfirmOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [confirmOpen]);

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    []
  );

  const pageUrl = id
    ? `${getPublicSiteBase()}/statblock/${encodeURIComponent(id)}`
    : '';
  const playerPageUrl = id
    ? `${getPublicSiteBase()}/statblock/${encodeURIComponent(id)}?player=1`
    : '';
  const flashCopy = (label: string) => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopyHint(label);
    copyTimerRef.current = setTimeout(() => setCopyHint(null), 2000);
  };

  const copyPageUrl = async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(playerMode ? playerPageUrl : pageUrl);
      flashCopy('Link copied');
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const copyMd = async () => {
    if (!pageUrl) return;
    const url = playerMode ? playerPageUrl : pageUrl;
    const line = block?.name
      ? `[${block.name.replace(/]/g, '')}](${url})`
      : url;
    try {
      await navigator.clipboard.writeText(line);
      flashCopy('Markdown copied');
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const copyPlain = async () => {
    if (!block || !pageUrl) return;
    const url = playerMode ? playerPageUrl : pageUrl;
    try {
      await navigator.clipboard.writeText(buildStatblockPlainText(block, traitsRef, url));
      flashCopy('Text copied');
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const handleDuplicate = async () => {
    if (!block) return;
    setError(null);
    setDupBusy(true);
    const r = await postDuplicateStatblock(block);
    setDupBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.push(`/statblock/${encodeURIComponent(r.id)}/edit`);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await deleteStatblockAction(id);
      if (!res.ok) {
        setError(res.error);
        setDeleting(false);
        return;
      }
      router.push('/');
    } catch (e) {
      console.error(e);
      setError('Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="grim-page max-w-xl lg:max-w-md xl:max-w-lg mx-auto">
        <div className="grim-card shimmer h-80 p-6 w-full">
          <div className="h-6 w-1/2 bg-ink-900/80 rounded mb-3" />
          <div className="h-40 w-full bg-ink-900/60 rounded" />
        </div>
      </div>
    );
  }

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

  return (
    <div className="grim-page">
      <div className="flex items-center justify-between mb-5 print:hidden">
        <Link href="/" className="grim-back-link">
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" />
          Bestiary
        </Link>
        <div className="flex flex-wrap gap-2 items-center relative justify-end">
          {copyHint && (
            <span className="text-[0.65rem] uppercase tracking-wider text-gold-400" role="status">
              {copyHint}
            </span>
          )}
          {!playerMode && (
            <>
          <button
            type="button"
            onClick={() => {
              if (!block) return;
              const data = JSON.stringify(block, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${block.id || 'statblock'}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="grim-btn-ghost"
            aria-label="Download JSON"
          >
            <ScrollIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>
          <button
            type="button"
            onClick={copyPageUrl}
            className="grim-btn-ghost"
            aria-label="Copy page link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy link</span>
          </button>
          <button
            type="button"
            onClick={copyPlain}
            className="grim-btn-ghost"
            aria-label="Copy as plain text summary"
            title="Name, wounds, move, short note, link — for chat or VTT"
          >
            <ScrollIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Text</span>
          </button>
          <button
            type="button"
            onClick={copyMd}
            className="grim-btn-ghost"
            aria-label="Copy as markdown"
          >
            <ScrollIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MD</span>
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={dupBusy}
            className="grim-btn-ghost"
            aria-label="Duplicate as new stat block"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{dupBusy ? '…' : 'Duplicate'}</span>
          </button>
            </>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="grim-btn-ghost"
            aria-label="Print"
          >
            <PrinterIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
          {!playerMode && (
            <>
          <Link
            href={`/statblock/${encodeURIComponent(id ?? '')}/edit`}
            className="grim-btn-ghost"
          >
            <EditIcon className="w-3.5 h-3.5" />
            Edit
          </Link>
          <Link
            href={id ? `/statblock/${encodeURIComponent(id)}?player=1` : '#'}
            className="grim-btn-ghost"
          >
            Player view
          </Link>
          <div className="relative" ref={confirmRef}>
            <button
              type="button"
              onClick={() => setConfirmOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={confirmOpen}
              className="inline-flex items-center gap-1.5 rounded border border-blood-500/70 bg-blood-800/60 px-3 py-1.5 text-parchment-50 text-xs uppercase tracking-wider transition-all duration-base ease-grim hover:bg-blood-600"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Delete
            </button>
            <AnimatePresence>
              {confirmOpen && (
                <motion.div
                  key="confirm"
                  role="dialog"
                  aria-label="Confirm delete"
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -2, scale: 0.98 }}
                  transition={{ duration: 0.16, ease }}
                  className="absolute right-0 top-full mt-2 w-64 z-30 grim-card p-3 text-left border-blood-700/70"
                >
                  <p className="text-parchment text-sm mb-3">
                    Delete this stat block? This cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(false)}
                      className="grim-btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="grim-btn-primary"
                    >
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            </>
          )}
          {playerMode && id && (
            <Link href={`/statblock/${encodeURIComponent(id)}`} className="grim-btn-ghost">
              GM view
            </Link>
          )}
        </div>
      </div>

      {block && (
        <header className="print:hidden mb-4 min-w-0 max-w-xl lg:max-w-md xl:max-w-lg mx-auto w-full">
          <h1 className="sr-only">{block.name || String(id ?? 'Stat block')}</h1>
          <p className="grim-label">Stat block</p>
          {playerMode ? (
            <p className="text-parchment-200/88 text-sm max-w-2xl">
              Player view: the card below is a reference. Switch to GM view for session tools, edit,
              and delete.
            </p>
          ) : (
            <p className="text-parchment-200/88 text-sm max-w-2xl">
              Session tools and quick dice are <span className="text-parchment/75">above</span> the
              card so you can roll or jot notes before scrolling the full block. The name and stats
              live on the card. For initiative across several creatures, build an encounter on the
              bestiary and open{' '}
              <Link href="/view" className="text-gold-500/90 hover:underline">
                Encounter
              </Link>
              .
            </p>
          )}
        </header>
      )}

      {block && !playerMode && id && (
        <section
          className="max-w-xl lg:max-w-md xl:max-w-lg mx-auto mb-4 print:hidden w-full space-y-3"
          aria-labelledby="statblock-page-tools-heading"
        >
          <h2
            id="statblock-page-tools-heading"
            className="font-display text-lg sm:text-xl text-gold-400/95 tracking-wide"
          >
            Session tools
          </h2>
          <p className="text-parchment-200/85 text-sm -mt-1 max-w-2xl">
            Notes, combat log, copy bundle, and dice for this page only&mdash;separate from a full
            table encounter.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ViewDiceRoller compact historyKey={id ? `statblock:${String(id)}` : undefined} />
            <ViewDamageRoller compact logKey={id ? `statblock:${String(id)}` : undefined} />
            <ViewD6Roller compact logKey={id ? `statblock:${String(id)}` : undefined} />
          </div>
          <ViewCurrencyHelper compact />
          <ViewOpposedD100 compact logKey={id ? `statblock:${String(id)}` : undefined} />
          <ViewHitLocationRoller compact logKey={id ? `statblock:${String(id)}` : undefined} />
          <ViewSceneTimeChips compact viewKey={`statblock:${String(id)}`} />
          <ViewSessionNotes viewKey={`statblock:${String(id)}`} />
          <ViewCombatLog viewKey={`statblock:${String(id)}`} />
          <ViewSessionBundleCopy viewKey={`statblock:${String(id)}`} />
        </section>
      )}

      <motion.article
        initial={rise.initial}
        animate={rise.animate}
        transition={rise.transition}
        className="statblock-print-root max-w-xl lg:max-w-md xl:max-w-lg mx-auto"
        aria-label="Stat block card"
      >
        {block && !playerMode && (
          <div className="mb-2 flex justify-end print:hidden">
            <MultiViewWoundBar
              viewKey="statblock-page"
              block={block}
              traitsRef={traitsRef}
              dense
            />
          </div>
        )}
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
      </motion.article>
    </div>
  );
}

export default function StatBlockView() {
  return (
    <Suspense
      fallback={
        <div className="grim-page max-w-xl mx-auto">
          <div className="grim-card shimmer h-80 p-6 w-full">
            <div className="h-6 w-1/2 bg-ink-900/80 rounded mb-3" />
            <div className="h-40 w-full bg-ink-900/60 rounded" />
          </div>
        </div>
      }
    >
      <StatBlockViewInner />
    </Suspense>
  );
}
