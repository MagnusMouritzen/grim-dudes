'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { statblockBodySchema } from '@/lib/validateStatblock';
import { z } from 'zod';
import { ChevronIcon, EditIcon, PrinterIcon, ScrollIcon, SkullIcon } from './icons';

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
  const packParam = searchParams.get('pack');
  const idsParam = searchParams.get('ids');
  const idsFromQuery = useMemo(() => parseIds(idsParam), [idsParam]);
  const [resolvedIds, setResolvedIds] = useState<string[] | null>(
    packParam ? null : idsFromQuery
  );
  const { ease } = useGrimMotion();

  const [blocks, setBlocks] = useState<Statblock[]>([]);
  const [skillsRef, setSkillsRef] = useState<SkillRef[]>([]);
  const [traitsRef, setTraitsRef] = useState<TraitRef[]>([]);
  const [weaponsRef, setWeaponsRef] = useState<WeaponsRef | null>(null);
  const [armourRef, setArmourRef] = useState<ArmourRef | null>(null);
  const [careersRef, setCareersRef] = useState<CareersRef | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve `?pack=<id>` into a list of ids once per pack.
  useEffect(() => {
    if (!packParam) {
      setResolvedIds(idsFromQuery);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API}/sharepacks/${encodeURIComponent(packParam)}`)
      .then((r) => {
        if (r.status === 404) throw new Error('Share link not found or expired');
        if (!r.ok) throw new Error('Could not load share link');
        return r.json();
      })
      .then((data: { ids?: string[] }) => {
        setResolvedIds(Array.isArray(data.ids) ? data.ids : []);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Share link failed'));
  }, [packParam, idsFromQuery]);

  const ids = resolvedIds ?? [];
  const idsKey = ids.join(',');

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
              .map((b) => safeParse(statblockBodySchema.passthrough(), b))
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

  if (resolvedIds !== null && ids.length === 0) {
    return (
      <div className="grim-card p-8 text-center flex flex-col items-center gap-4 max-w-xl mx-auto">
        <ScrollIcon className="w-12 h-12 text-gold-500" />
        <div>
          <h2 className="font-display text-xl text-gold-400 tracking-wide">
            No stat blocks selected
          </h2>
          <p className="text-parchment/80 mt-1 max-w-md mx-auto text-sm">
            From the bestiary, tick the circles next to entries and choose{' '}
            <strong className="text-gold-400">View together</strong>, or open{' '}
            <code className="text-parchment/95 bg-ink-900/80 border border-iron-700 px-1 py-0.5 rounded font-mono text-xs">
              /view?ids=id1,id2
            </code>
            .
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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-parchment/70 hover:text-gold-400 text-xs uppercase tracking-wider transition-colors duration-fast"
        >
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" /> Bestiary
        </Link>
        <div className="flex items-center gap-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-parchment/50">
            {blocks.length} {blocks.length === 1 ? 'stat block' : 'stat blocks'}
          </p>
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
        className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-6 items-start"
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
                className="min-w-0 flex flex-col gap-2"
              >
                <div className="flex flex-wrap justify-end gap-2 print:hidden">
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
                </div>
                <StatBlockCard
                  block={block}
                  dense
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
    </div>
  );
}
