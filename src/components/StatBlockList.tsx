'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import StatBlockCard from './StatBlockCard';
import { computeEffectiveStats } from '@/lib/statblockDerived';
import type { Statblock, TraitRef } from '@/lib/types';
import { useGrimMotion } from '@/lib/useMotion';
import {
  CheckIcon,
  CloseIcon,
  PlusIcon,
  SearchIcon,
  ScrollIcon,
  SkullIcon,
  SortIcon,
} from './icons';

const API = '/api';

type SortKey = 'name' | 'wounds' | 'movement';

export default function StatBlockList() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Statblock[]>([]);
  const [traitsRef, setTraitsRef] = useState<TraitRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [tagFilter, setTagFilter] = useState('');
  const { ease } = useGrimMotion();

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const viewTogether = () => {
    if (selectedIds.length === 0) return;
    const q = selectedIds.map(encodeURIComponent).join(',');
    router.push(`/view?ids=${q}`);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API}/statblocks`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('Failed to load'))
      ),
      fetch(`${API}/traits`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([data, traits]) => {
        setBlocks(Array.isArray(data) ? (data as Statblock[]) : []);
        setTraitsRef(Array.isArray(traits) ? (traits as TraitRef[]) : []);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filteredSorted = useMemo(() => {
    let list = blocks;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          (b.name || '').toLowerCase().includes(q) ||
          String(b.id || '').toLowerCase().includes(q)
      );
    }
    const tf = tagFilter.trim().toLowerCase();
    if (tf) {
      list = list.filter(
        (b) => Array.isArray(b.tags) && b.tags.some((t) => String(t).toLowerCase().includes(tf))
      );
    }
    const decorated = list.map((b) => {
      const { effectiveWounds, effectiveMovement } = computeEffectiveStats(b, traitsRef);
      return { block: b, effectiveWounds, effectiveMovement };
    });
    decorated.sort((a, b) => {
      if (sortBy === 'name') return (a.block.name || '').localeCompare(b.block.name || '');
      if (sortBy === 'wounds')
        return (
          b.effectiveWounds - a.effectiveWounds ||
          (a.block.name || '').localeCompare(b.block.name || '')
        );
      if (sortBy === 'movement')
        return (
          b.effectiveMovement - a.effectiveMovement ||
          (a.block.name || '').localeCompare(b.block.name || '')
        );
      return 0;
    });
    return decorated;
  }, [blocks, search, sortBy, tagFilter, traitsRef]);

  const totalCount = blocks.length;
  const filteredCount = filteredSorted.length;
  const hasFilters = Boolean(search.trim() || tagFilter.trim() || sortBy !== 'name');

  if (loading) {
    return (
      <div className="space-y-6">
        <HeroSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grim-card shimmer h-40 p-4">
              <div className="h-5 w-2/3 bg-ink-900/80 rounded mb-3" />
              <div className="h-3 w-full bg-ink-900/60 rounded mb-2" />
              <div className="h-3 w-5/6 bg-ink-900/60 rounded mb-2" />
              <div className="h-3 w-4/6 bg-ink-900/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="grim-label mb-1">Warhammer Fantasy Roleplay 4e</p>
          <h1 className="font-display text-display-lg sm:text-display-xl text-gold-400 tracking-wide leading-none">
            Bestiary
          </h1>
          <p className="text-parchment/70 mt-2 text-sm max-w-xl">
            Foes, friends and fell creatures of the Old World.
            <span className="text-iron-500"> · </span>
            <span className="font-mono tabular-nums text-parchment/85">{totalCount}</span>{' '}
            <span className="text-parchment/60">
              {totalCount === 1 ? 'entry' : 'entries'}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.button
                key="view-together"
                type="button"
                onClick={viewTogether}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18, ease }}
                className="grim-btn-primary"
              >
                View together
                <span className="font-mono tabular-nums text-[0.7rem] opacity-80">
                  ({selectedIds.length})
                </span>
              </motion.button>
            )}
            {selectedIds.length > 0 && (
              <motion.button
                key="clear-selection"
                type="button"
                onClick={() => setSelectedIds([])}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease }}
                className="grim-btn-ghost"
              >
                <CloseIcon className="w-3.5 h-3.5" />
                Clear
              </motion.button>
            )}
          </AnimatePresence>
          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 rounded border border-gold-700 bg-ink-800/70 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-400 transition-all duration-fast ease-grim hover:border-gold-500 hover:text-parchment hover:bg-blood-700/50"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            New Stat Block
          </Link>
        </div>
      </header>

      <div className="grim-divider" />

      {totalCount > 0 && (
        <div className="grim-card p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 min-w-[12rem]">
              <label className="grim-label flex items-center gap-1.5">
                <SearchIcon className="w-3 h-3" /> Search
              </label>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or id…"
                className="grim-input"
              />
            </div>
            <div className="w-full sm:w-44">
              <label className="grim-label flex items-center gap-1.5">
                <SortIcon className="w-3 h-3" /> Sort
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="grim-input"
              >
                <option value="name">Name (A–Z)</option>
                <option value="wounds">Wounds (high)</option>
                <option value="movement">Movement (high)</option>
              </select>
            </div>
            <div className="flex-1 min-w-[10rem]">
              <label className="grim-label">Tag contains</label>
              <input
                type="search"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="e.g. undead, ubersreik…"
                className="grim-input"
              />
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTagFilter('');
                  setSortBy('name');
                }}
                className="grim-btn-ghost shrink-0"
              >
                <CloseIcon className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[0.7rem] uppercase tracking-wider text-parchment/50 font-mono">
            <span>
              Showing <span className="text-gold-400">{filteredCount}</span> / {totalCount}
            </span>
            <span className="hidden sm:inline text-parchment/40 normal-case tracking-normal">
              Select multiple, then open them side by side with View together.
            </span>
          </div>
        </div>
      )}

      {totalCount === 0 ? (
        <EmptyState
          title="The bestiary is empty"
          description="No creatures yet. Begin by creating a new stat block or migrating the sample JSON into Upstash."
          icon={<SkullIcon className="w-14 h-14 text-blood-500" />}
          action={
            <Link href="/new" className="grim-btn-primary">
              <PlusIcon className="w-4 h-4" />
              Create your first stat block
            </Link>
          }
        />
      ) : filteredCount === 0 ? (
        <EmptyState
          title="No entries match your filters"
          description="Try loosening the search or clearing tag filters."
          icon={<ScrollIcon className="w-14 h-14 text-gold-500" />}
          action={
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setTagFilter('');
                setSortBy('name');
              }}
              className="grim-btn-ghost"
            >
              <CloseIcon className="w-3.5 h-3.5" />
              Reset filters
            </button>
          }
        />
      ) : (
        <motion.div
          layout
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredSorted.map(({ block }) => {
              const blockId = String(block.id ?? '');
              const selected = selectedIds.includes(blockId);
              return (
                <motion.div
                  key={blockId}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease }}
                  className="relative group"
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={selected ? 'Deselect' : 'Select for side-by-side view'}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSelected(blockId);
                    }}
                    className={`absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-fast ease-grim ${
                      selected
                        ? 'bg-gold-500 border-gold-300 text-ink-900 shadow-gold'
                        : 'bg-ink-900/90 border-iron-600 text-transparent group-hover:border-gold-500 group-hover:text-gold-400'
                    }`}
                  >
                    <AnimatePresence>
                      {selected && (
                        <motion.span
                          key="check"
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ duration: 0.18, ease }}
                          className="flex"
                        >
                          <CheckIcon className="w-4 h-4" strokeWidth={2.5} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!selected && (
                      <PlusIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                  <Link
                    href={`/statblock/${blockId}`}
                    className="block focus:outline-none"
                  >
                    <StatBlockCard block={block} compact traitsRef={traitsRef} />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-40 bg-ink-800 rounded shimmer" />
      <div className="h-12 w-64 bg-ink-800 rounded shimmer" />
      <div className="h-3 w-80 bg-ink-800 rounded shimmer" />
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="grim-card p-10 text-center flex flex-col items-center gap-4">
      <div className="rounded-full border border-gold-700/40 bg-ink-900/80 p-4">{icon}</div>
      <div>
        <h2 className="font-display text-xl text-gold-400 tracking-wide">{title}</h2>
        <p className="text-parchment/80 mt-1 max-w-md mx-auto">{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="grim-card p-8 text-center flex flex-col items-center gap-4 border-blood-700/60">
      <div className="rounded-full border border-blood-700/60 bg-blood-900/40 p-4">
        <SkullIcon className="w-12 h-12 text-blood-400" />
      </div>
      <div>
        <h2 className="font-display text-xl text-blood-400 tracking-wide">The stars are ill</h2>
        <p className="text-parchment/80 mt-1 max-w-md mx-auto text-sm">{message}</p>
      </div>
    </div>
  );
}
