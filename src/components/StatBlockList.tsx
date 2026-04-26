'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useDeferredValue,
  useRef,
  useLayoutEffect,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import StatBlockCard from './StatBlockCard';
import { loadFavoriteIds, saveFavoriteIds } from '@/lib/bestiaryFavorites';
import { computeEffectiveStats } from '@/lib/statblockDerived';
import { getPublicSiteBase } from '@/lib/siteUrl';
import type { Statblock, TraitRef } from '@/lib/types';
import { useGrimMotion } from '@/lib/useMotion';
import { safeParse, statblockArraySchema, traitRefSchema } from '@/lib/apiSchemas';
import { z } from 'zod';
import {
  CheckIcon,
  CloseIcon,
  DiceIcon,
  PlusIcon,
  SearchIcon,
  ScrollIcon,
  SkullIcon,
  StarIcon,
  SortIcon,
  TrashIcon,
  LinkIcon,
  EditIcon,
} from './icons';

const API = '/api';

type SortKey = 'name' | 'wounds' | 'movement';

const DEFAULT_SORT: SortKey = 'name';
/** When at least this many cards match, render rows inside a windowed list for performance. */
const VIRTUALIZE_THRESHOLD = 24;

type SortableRow = {
  block: Statblock;
  effectiveWounds: number;
  effectiveMovement: number;
};

type StatBlockListProps = {
  /**
   * When supplied (via SSR), the list uses this as its initial state and skips
   * the client-side fetch for statblocks.
   */
  initialBlocks?: Statblock[];
  initialTraits?: TraitRef[];
};

function sortKeyFromParam(s: string | null): SortKey {
  if (s === 'wounds' || s === 'movement' || s === 'name') return s;
  return DEFAULT_SORT;
}

function useBestiaryColumnCount() {
  const [cols, setCols] = useState(1);
  useEffect(() => {
    const ro = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCols(3);
      else if (w >= 640) setCols(2);
      else setCols(1);
    };
    ro();
    window.addEventListener('resize', ro);
    return () => window.removeEventListener('resize', ro);
  }, []);
  return cols;
}

export function BestiaryListSkeleton() {
  return (
    <div className="space-y-6 grim-page">
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

export default function StatBlockList({
  initialBlocks,
  initialTraits,
}: StatBlockListProps = {}) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const spString = searchParams.toString();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listScrollParentRef = useRef<HTMLDivElement | null>(null);
  const canWriteUrl = useRef(false);
  const hasInitial = Array.isArray(initialBlocks);
  const [blocks, setBlocks] = useState<Statblock[]>(initialBlocks ?? []);
  const [traitsRef, setTraitsRef] = useState<TraitRef[]>(initialTraits ?? []);
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [sortBy, setSortBy] = useState<SortKey>(DEFAULT_SORT);
  const [tagFilter, setTagFilter] = useState('');
  const deferredTag = useDeferredValue(tagFilter);
  const [packBusy, setPackBusy] = useState(false);
  const [rosters, setRosters] = useState<
    { slug: string; name: string; count: number; updatedAt: number }[]
  >([]);
  const [rosterListError, setRosterListError] = useState<string | null>(null);
  const [saveRosterOpen, setSaveRosterOpen] = useState(false);
  const [rosterName, setRosterName] = useState('');
  const [rosterSaveBusy, setRosterSaveBusy] = useState(false);
  const [rosterModalError, setRosterModalError] = useState<string | null>(null);
  const [editRosterOpen, setEditRosterOpen] = useState(false);
  const [editRosterSlug, setEditRosterSlug] = useState<string | null>(null);
  const [editRosterName, setEditRosterName] = useState('');
  const [editRosterIdsText, setEditRosterIdsText] = useState('');
  const [editRosterBusy, setEditRosterBusy] = useState(false);
  const [editRosterErr, setEditRosterErr] = useState<string | null>(null);
  const [rosterCopyHint, setRosterCopyHint] = useState<string | null>(null);
  const [viewUrlCopyHint, setViewUrlCopyHint] = useState(false);
  const [mdFilterCopyHint, setMdFilterCopyHint] = useState(false);
  const [starsMdHint, setStarsMdHint] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { ease } = useGrimMotion();
  const columnCount = useBestiaryColumnCount();

  useEffect(() => {
    setFavoriteIds(loadFavoriteIds());
  }, []);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleFavorite = useCallback((e: React.MouseEvent, blockId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      saveFavoriteIds(next);
      return next;
    });
  }, []);

  const viewTogether = async () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.length <= 5) {
      const q = selectedIds.map(encodeURIComponent).join(',');
      router.push(`/view?ids=${q}`);
      return;
    }
    setPackBusy(true);
    try {
      const res = await fetch(`${API}/sharepacks`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        const body = (await res.json()) as { id: string };
        router.push(`/view?pack=${encodeURIComponent(body.id)}`);
      } else {
        const q = selectedIds.map(encodeURIComponent).join(',');
        router.push(`/view?ids=${q}`);
      }
    } finally {
      setPackBusy(false);
    }
  };

  const copyEncounterViewUrl = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const base = getPublicSiteBase();
    let url: string;
    if (selectedIds.length <= 5) {
      url = `${base}/view?ids=${selectedIds.map(encodeURIComponent).join(',')}`;
    } else {
      setPackBusy(true);
      try {
        const res = await fetch(`${API}/sharepacks`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds }),
        });
        if (res.ok) {
          const body = (await res.json()) as { id: string };
          url = `${base}/view?pack=${encodeURIComponent(body.id)}`;
        } else {
          url = `${base}/view?ids=${selectedIds.map(encodeURIComponent).join(',')}`;
        }
      } catch {
        url = `${base}/view?ids=${selectedIds.map(encodeURIComponent).join(',')}`;
      } finally {
        setPackBusy(false);
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setViewUrlCopyHint(true);
      window.setTimeout(() => setViewUrlCopyHint(false), 2000);
    } catch {
      setViewUrlCopyHint(false);
    }
  }, [selectedIds]);

  const refreshRosters = useCallback(() => {
    fetch(`${API}/encounter-rosters`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setRosterListError(null);
        if (Array.isArray(data)) {
          setRosters(
            data.filter(
              (x: unknown) =>
                x != null &&
                typeof x === 'object' &&
                'slug' in x &&
                typeof (x as { slug: string }).slug === 'string'
            ) as { slug: string; name: string; count: number; updatedAt: number }[]
          );
        } else {
          setRosters([]);
        }
      })
      .catch(() => setRosterListError('Could not load encounter rosters'));
  }, []);

  const pickRandomFromFilter = () => {
    if (filteredSorted.length === 0) return;
    const row = filteredSorted[Math.floor(Math.random() * filteredSorted.length)];
    if (!row) return;
    const bid = String(row.block.id ?? '');
    if (bid) router.push(`/statblock/${encodeURIComponent(bid)}`);
  };

  const saveEncounterRoster = async () => {
    const name = rosterName.trim();
    if (!name || selectedIds.length === 0) return;
    setRosterModalError(null);
    setRosterSaveBusy(true);
    try {
      const res = await fetch(`${API}/encounter-rosters`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, ids: selectedIds }),
      });
      if (res.status === 401) {
        setRosterModalError('Sign in to save a roster.');
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setRosterModalError(j.error ?? 'Could not save roster');
        return;
      }
      const body = (await res.json()) as { slug?: string };
      const slug = body.slug;
      setSaveRosterOpen(false);
      setRosterName('');
      refreshRosters();
      if (slug) {
        router.push(`/view?roster=${encodeURIComponent(slug)}`);
      }
    } catch {
      setRosterModalError('Could not save roster');
    } finally {
      setRosterSaveBusy(false);
    }
  };

  const copyRosterViewUrl = async (slug: string) => {
    const u = `${getPublicSiteBase()}/view?roster=${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(u);
      setRosterCopyHint(slug);
      setTimeout(() => setRosterCopyHint(null), 2000);
    } catch {
      setRosterListError('Could not copy link');
    }
  };

  const openRosterEdit = (slug: string) => {
    setEditRosterSlug(slug);
    setEditRosterErr(null);
    setEditRosterBusy(true);
    fetch(`${API}/encounter-rosters/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('load'))))
      .then((d: { name?: string; ids?: string[] }) => {
        setEditRosterName(typeof d.name === 'string' ? d.name : '');
        setEditRosterIdsText(Array.isArray(d.ids) ? d.ids.join('\n') : '');
        setEditRosterOpen(true);
      })
      .catch(() => {
        setRosterListError('Could not load roster for edit');
        setEditRosterSlug(null);
      })
      .finally(() => setEditRosterBusy(false));
  };

  const saveRosterEdit = async () => {
    if (!editRosterSlug) return;
    const name = editRosterName.trim();
    const ids = editRosterIdsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!name) {
      setEditRosterErr('Name is required');
      return;
    }
    if (ids.length === 0) {
      setEditRosterErr('Add at least one stat block id');
      return;
    }
    setEditRosterErr(null);
    setEditRosterBusy(true);
    try {
      const res = await fetch(`${API}/encounter-rosters/${encodeURIComponent(editRosterSlug)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, ids }),
      });
      if (res.status === 401) {
        setEditRosterErr('Sign in to edit rosters');
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setEditRosterErr(j.error ?? 'Update failed');
        return;
      }
      setEditRosterOpen(false);
      setEditRosterSlug(null);
      refreshRosters();
    } catch {
      setEditRosterErr('Update failed');
    } finally {
      setEditRosterBusy(false);
    }
  };

  const deleteEncounterRoster = async (slug: string) => {
    try {
      const res = await fetch(`${API}/encounter-rosters/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.status === 401) {
        setRosterListError('Sign in to delete rosters.');
        return;
      }
      if (!res.ok) return;
      setRosters((prev) => prev.filter((r) => r.slug !== slug));
    } catch {
      setRosterListError('Could not delete roster');
    }
  };

  useEffect(() => {
    if (!saveRosterOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSaveRosterOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [saveRosterOpen]);

  useLayoutEffect(() => {
    const p = new URLSearchParams(spString);
    setSearch(p.get('q') ?? '');
    setTagFilter(p.get('tag') ?? '');
    setSortBy(sortKeyFromParam(p.get('sort')));
    canWriteUrl.current = true;
  }, [spString]);

  useEffect(() => {
    if (!canWriteUrl.current) return;
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (sortBy !== 'name') params.set('sort', sortBy);
    if (tagFilter.trim()) params.set('tag', tagFilter.trim());
    const next = params.toString();
    if (next === spString) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [search, sortBy, tagFilter, router, pathname, spString]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    refreshRosters();
  }, [refreshRosters]);

  useEffect(() => {
    if (hasInitial) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API}/statblocks`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('Failed to load'))
      ),
      fetch(`${API}/traits`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([data, traits]) => {
        const parsedBlocks = safeParse(statblockArraySchema, data);
        setBlocks((parsedBlocks as Statblock[] | null) ?? []);
        const parsedTraits = safeParse(z.array(traitRefSchema), traits);
        setTraitsRef((parsedTraits as TraitRef[] | null) ?? []);
      })
      .catch(() => setError('Could not load stat blocks'))
      .finally(() => setLoading(false));
  }, [hasInitial]);

  const filteredSorted = useMemo(() => {
    let list = blocks;
    const q = deferredSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          (b.name || '').toLowerCase().includes(q) ||
          String(b.id || '').toLowerCase().includes(q)
      );
    }
    const tf = deferredTag.trim().toLowerCase();
    if (tf) {
      list = list.filter(
        (b) => Array.isArray(b.tags) && b.tags.some((t) => String(t).toLowerCase().includes(tf))
      );
    }
    if (favoritesOnly) {
      list = list.filter((b) => favoriteIds.has(String(b.id ?? '')));
    }
    const decorated: SortableRow[] = list.map((b) => {
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
  }, [blocks, deferredSearch, sortBy, deferredTag, traitsRef, favoritesOnly, favoriteIds]);

  const rowChunks = useMemo(() => {
    const rows: SortableRow[][] = [];
    for (let i = 0; i < filteredSorted.length; i += columnCount) {
      rows.push(filteredSorted.slice(i, i + columnCount));
    }
    return rows;
  }, [filteredSorted, columnCount]);

  const shouldVirtualize = filteredSorted.length > VIRTUALIZE_THRESHOLD;
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? rowChunks.length : 0,
    getScrollElement: () => listScrollParentRef.current,
    estimateSize: () => 220,
    overscan: 2,
  });

  const totalCount = blocks.length;
  const filteredCount = filteredSorted.length;
  const hasFilters = Boolean(
    search.trim() || tagFilter.trim() || sortBy !== 'name' || favoritesOnly
  );

  const clearFilters = () => {
    setSearch('');
    setTagFilter('');
    setSortBy('name');
    setFavoritesOnly(false);
  };

  const copyFilteredAsMarkdown = useCallback(async () => {
    if (filteredSorted.length === 0) return;
    const base = getPublicSiteBase();
    const lines = filteredSorted.map(({ block }) => {
      const id = String(block.id ?? '');
      const name = (block.name || id).replace(/]/g, '');
      return `[${name}](${base}/statblock/${encodeURIComponent(id)})`;
    });
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
    } catch {
      return;
    }
    setMdFilterCopyHint(true);
    window.setTimeout(() => setMdFilterCopyHint(false), 2000);
  }, [filteredSorted]);

  const copyStarredAsMarkdown = useCallback(async () => {
    if (favoriteIds.size === 0) return;
    const base = getPublicSiteBase();
    const lines = [...blocks]
      .filter((b) => favoriteIds.has(String(b.id ?? '')))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map((block) => {
        const id = String(block.id ?? '');
        const name = (block.name || id).replace(/]/g, '');
        return `[${name}](${base}/statblock/${encodeURIComponent(id)})`;
      });
    if (lines.length === 0) return;
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
    } catch {
      return;
    }
    setStarsMdHint(true);
    window.setTimeout(() => setStarsMdHint(false), 2000);
  }, [blocks, favoriteIds]);

  const viewFilteredTogether = useCallback(async () => {
    const ids = filteredSorted.map(({ block }) => String(block.id ?? '')).filter(Boolean);
    if (ids.length === 0) return;
    if (ids.length <= 5) {
      router.push(`/view?ids=${ids.map(encodeURIComponent).join(',')}`);
      return;
    }
    setPackBusy(true);
    try {
      const res = await fetch(`${API}/sharepacks`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const body = (await res.json()) as { id: string };
        router.push(`/view?pack=${encodeURIComponent(body.id)}`);
      } else {
        router.push(`/view?ids=${ids.map(encodeURIComponent).join(',')}`);
      }
    } finally {
      setPackBusy(false);
    }
  }, [filteredSorted, router]);

  if (loading) {
    return <BestiaryListSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6 grim-page">
      <header className="flex flex-wrap items-end justify-between gap-4 print:hidden">
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
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.button
                  key="view-together"
                  type="button"
                  onClick={viewTogether}
                  disabled={packBusy}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18, ease }}
                  className="grim-btn-primary"
                >
                  {packBusy ? 'Preparing…' : 'View together'}
                  <span className="font-mono tabular-nums text-[0.7rem] opacity-80">
                    ({selectedIds.length})
                  </span>
                </motion.button>
              )}
              {selectedIds.length > 0 && (
                <motion.button
                  key="copy-view-url"
                  type="button"
                  onClick={() => void copyEncounterViewUrl()}
                  disabled={packBusy}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18, ease }}
                  className="grim-btn-ghost inline-flex items-center gap-1.5"
                  title="Copy the same /view link you get from View together (uses a short share link for more than five picks)"
                  aria-label="Copy encounter view URL"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {viewUrlCopyHint ? 'Copied' : 'Copy link'}
                </motion.button>
              )}
              {selectedIds.length > 0 && (
                <motion.button
                  key="save-roster"
                  type="button"
                  onClick={() => {
                    setRosterModalError(null);
                    setSaveRosterOpen(true);
                  }}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18, ease }}
                  className="grim-btn-ghost"
                >
                  Save roster
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
              className="grim-header-new-stat"
            >
              <PlusIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New Stat Block</span>
            </Link>
          </div>
          {selectedIds.length > 5 && (
            <p className="text-xs text-parchment/55 text-right max-w-sm">
              More than five selections use a short share link so the address bar does not become
              too long.
            </p>
          )}
        </div>
      </header>

      <div className="grim-divider" />

      {totalCount > 0 && (
        <div className="grim-card p-3 sm:p-4 print:hidden">
          <p id="bestiary-filters-label" className="grim-label mb-3">
            Find &amp; sort
          </p>
          <div
            className="flex flex-col sm:flex-row sm:items-end gap-3"
            role="search"
            aria-labelledby="bestiary-filters-label"
          >
            <div className="flex-1 min-w-[12rem]">
              <label
                htmlFor="bestiary-search"
                className="grim-label flex items-center gap-1.5"
              >
                <SearchIcon className="w-3 h-3" /> Search
                <span className="hidden sm:inline ml-auto text-[0.6rem] text-parchment/40">
                  press /
                </span>
              </label>
              <input
                id="bestiary-search"
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && search) {
                    e.preventDefault();
                    setSearch('');
                  }
                }}
                placeholder="Name or id…"
                className="grim-input"
                autoComplete="off"
              />
            </div>
            <div className="w-full sm:w-44">
              <label
                htmlFor="bestiary-sort"
                className="grim-label flex items-center gap-1.5"
              >
                <SortIcon className="w-3 h-3" /> Sort
              </label>
              <select
                id="bestiary-sort"
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
              <label htmlFor="bestiary-tag" className="grim-label">
                Tag contains
              </label>
              <input
                id="bestiary-tag"
                type="search"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="e.g. undead, ubersreik…"
                className="grim-input"
                autoComplete="off"
              />
            </div>
            <div className="flex items-end min-h-[2.5rem]">
              <label className="inline-flex items-center gap-2 cursor-pointer text-parchment/80 text-sm select-none pb-0.5">
                <input
                  type="checkbox"
                  className="rounded border-iron-600 bg-ink-900 text-gold-500 focus:ring-gold-500/50"
                  checked={favoritesOnly}
                  onChange={(e) => setFavoritesOnly(e.target.checked)}
                />
                <StarIcon className="w-3.5 h-3.5 text-gold-400/90 shrink-0" active={favoritesOnly} />
                <span className="text-[0.7rem] uppercase tracking-wider">Starred only</span>
              </label>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="grim-btn-ghost shrink-0"
              >
                <CloseIcon className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[0.7rem] uppercase tracking-wider text-parchment/50 font-mono">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <span>
                Showing <span className="text-gold-400">{filteredCount}</span> / {totalCount}
                {favoriteIds.size > 0 && (
                  <>
                    {' '}
                    · <span className="text-parchment/55">{favoriteIds.size}</span> starred
                  </>
                )}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {mdFilterCopyHint && (
                  <span className="text-gold-400/95 text-[0.65rem] normal-case" role="status">
                    List copied
                  </span>
                )}
                {starsMdHint && (
                  <span className="text-gold-400/95 text-[0.65rem] normal-case" role="status">
                    Stars copied
                  </span>
                )}
                {favoriteIds.size > 0 && (
                  <button
                    type="button"
                    onClick={copyStarredAsMarkdown}
                    className="inline-flex items-center gap-1.5 rounded border border-gold-700/50 bg-ink-900/50 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-gold-200/90 transition-colors duration-fast hover:border-gold-500/70"
                    title="All starred stat blocks as markdown (name order), ignoring filters"
                    aria-label="Copy starred list as markdown"
                  >
                    <ScrollIcon className="w-3.5 h-3.5" />
                    Copy stars MD
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyFilteredAsMarkdown}
                  disabled={filteredCount === 0}
                  title="Copy filtered entries as markdown links (one per line) for session notes or docs."
                  className="inline-flex items-center gap-1.5 rounded border border-iron-600/80 bg-ink-900/50 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-parchment/90 transition-colors duration-fast hover:border-gold-600 hover:text-gold-300 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Copy filtered list as markdown"
                >
                  <ScrollIcon className="w-3.5 h-3.5" />
                  Copy list MD
                </button>
                <button
                  type="button"
                  onClick={viewFilteredTogether}
                  disabled={filteredCount === 0 || packBusy}
                  title="Open every entry that matches the current filter in the multi stat view (short link if the list is long)."
                  className="inline-flex items-center gap-1.5 rounded border border-iron-600/80 bg-ink-900/50 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-parchment/90 transition-colors duration-fast hover:border-gold-600 hover:text-gold-300 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="View filtered list together"
                >
                  {packBusy ? '…' : 'View filtered'}
                </button>
                <button
                  type="button"
                  onClick={pickRandomFromFilter}
                  disabled={filteredCount === 0}
                  title="Picks at random from entries matching the current search and tag filter."
                  className="inline-flex items-center gap-1.5 rounded border border-iron-600/80 bg-ink-900/50 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-parchment/90 transition-colors duration-fast hover:border-gold-600 hover:text-gold-300 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Open a random stat block from the current list"
                >
                  <DiceIcon className="w-3.5 h-3.5" />
                  Random
                </button>
              </div>
            </div>
            <span className="text-parchment/40 normal-case tracking-normal sm:text-right">
              <span className="hidden sm:inline">Select multiple, then open them side by side with </span>
              <span className="sm:hidden">Select multiple, then </span>
              View together.
            </span>
          </div>
        </div>
      )}

      {totalCount > 0 && rosterListError && (
        <p className="text-xs text-blood-400/90 print:hidden">{rosterListError}</p>
      )}

      {totalCount > 0 && rosters.length > 0 && (
        <div className="grim-card p-3 sm:p-4 print:hidden">
          <p className="grim-label mb-2">Saved encounter rosters</p>
          <ul className="space-y-1.5 text-sm" aria-label="Saved encounter rosters">
            {rosters.map((r) => (
              <li
                key={r.slug}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-iron-800/50 pb-1.5 last:border-0 last:pb-0"
              >
                <Link
                  href={`/view?roster=${encodeURIComponent(r.slug)}`}
                  className="text-gold-400 hover:text-gold-300 hover:underline min-w-0"
                >
                  {r.name}
                </Link>
                <div className="flex items-center gap-1 ml-auto">
                  {rosterCopyHint === r.slug && (
                    <span className="text-[0.6rem] text-gold-400 mr-1">Copied</span>
                  )}
                  <span className="font-mono text-[0.65rem] text-parchment/45 tabular-nums">
                    {r.count} ids
                  </span>
                  <button
                    type="button"
                    onClick={() => void copyRosterViewUrl(r.slug)}
                    className="p-1 rounded text-parchment/50 hover:text-gold-400 hover:bg-ink-800/60"
                    aria-label={`Copy link to ${r.name}`}
                    title="Copy /view?roster= link"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openRosterEdit(r.slug)}
                    className="p-1 rounded text-parchment/50 hover:text-gold-400 hover:bg-ink-800/60"
                    aria-label={`Edit roster ${r.name}`}
                    disabled={editRosterBusy}
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteEncounterRoster(r.slug)}
                    className="p-1 rounded text-parchment/50 hover:text-blood-400 hover:bg-blood-900/40"
                    aria-label={`Delete roster ${r.name}`}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
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
          title={
            favoritesOnly && favoriteIds.size === 0
              ? 'No starred stat blocks'
              : 'No entries match your filters'
          }
          description={
            favoritesOnly && favoriteIds.size === 0
              ? 'Use the star on a card to pin recurring NPCs and monsters — stars are stored in this browser only.'
              : 'Try loosening the search, turning off “Starred only”, or clearing tag filters.'
          }
          icon={<ScrollIcon className="w-14 h-14 text-gold-500" />}
          action={
            <button type="button" onClick={clearFilters} className="grim-btn-ghost">
              <CloseIcon className="w-3.5 h-3.5" />
              Reset filters
            </button>
          }
        />
      ) : shouldVirtualize ? (
        <div
          ref={listScrollParentRef}
          className="max-h-[min(85vh,1500px)] overflow-y-auto pr-1 -mr-1"
          aria-label="Stat block list"
        >
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((vi) => {
              const row = rowChunks[vi.index];
              if (!row) return null;
              return (
                <div
                  key={vi.key}
                  className="absolute top-0 left-0 w-full pr-0"
                  style={{ transform: `translateY(${vi.start}px)` }}
                  data-index={vi.index}
                  ref={virtualizer.measureElement}
                >
                  <div
                    className={
                      columnCount === 1
                        ? 'grid grid-cols-1 gap-4'
                        : columnCount === 2
                          ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                          : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
                    }
                  >
                    {row.map(({ block }) => {
                      const blockId = String(block.id ?? '');
                      const selected = selectedIds.includes(blockId);
                      return (
                        <div key={blockId} className="relative group">
                          <button
                            type="button"
                            aria-pressed={favoriteIds.has(blockId)}
                            aria-label={
                              favoriteIds.has(blockId)
                                ? 'Remove from starred'
                                : 'Star for quick access in this browser'
                            }
                            onClick={(e) => toggleFavorite(e, blockId)}
                            className={`absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-fast ease-grim ${
                              favoriteIds.has(blockId)
                                ? 'border-gold-500/90 bg-ink-900/95 text-gold-400'
                                : 'bg-ink-900/90 border-iron-600 text-parchment/40 group-hover:border-gold-500/50 group-hover:text-gold-400/90'
                            }`}
                          >
                            <StarIcon className="w-3.5 h-3.5" active={favoriteIds.has(blockId)} />
                          </button>
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
                            {selected && <CheckIcon className="w-4 h-4" strokeWidth={2.5} />}
                            {!selected && (
                              <PlusIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                          <Link
                            href={`/statblock/${blockId}`}
                            aria-label={`Open ${block.name || blockId}`}
                            className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                          >
                            <StatBlockCard block={block} compact traitsRef={traitsRef} />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    aria-pressed={favoriteIds.has(blockId)}
                    aria-label={
                      favoriteIds.has(blockId)
                        ? 'Remove from starred'
                        : 'Star for quick access in this browser'
                    }
                    onClick={(e) => toggleFavorite(e, blockId)}
                    className={`absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-fast ease-grim ${
                      favoriteIds.has(blockId)
                        ? 'border-gold-500/90 bg-ink-900/95 text-gold-400'
                        : 'bg-ink-900/90 border-iron-600 text-parchment/40 group-hover:border-gold-500/50 group-hover:text-gold-400/90'
                    }`}
                  >
                    <StarIcon className="w-3.5 h-3.5" active={favoriteIds.has(blockId)} />
                  </button>
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
                    aria-label={`Open ${block.name || blockId}`}
                    className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                  >
                    <StatBlockCard block={block} compact traitsRef={traitsRef} />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {saveRosterOpen && (
          <motion.div
            key="roster-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/85 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSaveRosterOpen(false);
                setRosterModalError(null);
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="roster-dialog-title"
              className="grim-card w-full max-w-md p-4 border-gold-700/50 shadow-xl"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.99 }}
              transition={{ duration: 0.15, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="roster-dialog-title"
                className="font-display text-lg text-gold-400 tracking-wide mb-1"
              >
                Save encounter roster
              </h2>
              <p className="text-parchment/70 text-sm mb-3">
                Name this set of {selectedIds.length} stat block{selectedIds.length === 1 ? '' : 's'}.
                Open it anytime from the list below.
              </p>
              <label htmlFor="roster-name" className="grim-label">
                Name
              </label>
              <input
                id="roster-name"
                className="grim-input mt-1"
                value={rosterName}
                onChange={(e) => setRosterName(e.target.value)}
                placeholder="e.g. Bögenhafen night watch"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveEncounterRoster();
                }}
              />
              {rosterModalError && (
                <p className="text-blood-400 text-sm mt-2">{rosterModalError}</p>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="grim-btn-ghost"
                  onClick={() => {
                    setSaveRosterOpen(false);
                    setRosterModalError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="grim-btn-primary"
                  disabled={!rosterName.trim() || rosterSaveBusy}
                  onClick={() => void saveEncounterRoster()}
                >
                  {rosterSaveBusy ? 'Saving…' : 'Save and open view'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editRosterOpen && (
          <motion.div
            key="roster-edit-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/85 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setEditRosterOpen(false);
                setEditRosterErr(null);
                setEditRosterSlug(null);
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="roster-edit-title"
              className="grim-card w-full max-w-md p-4 border-gold-700/50 shadow-xl max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.99 }}
              transition={{ duration: 0.15, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="roster-edit-title"
                className="font-display text-lg text-gold-400 tracking-wide mb-3"
              >
                Edit encounter roster
              </h2>
              <label htmlFor="roster-edit-name" className="grim-label">
                Name
              </label>
              <input
                id="roster-edit-name"
                className="grim-input mt-1 mb-3"
                value={editRosterName}
                onChange={(e) => setEditRosterName(e.target.value)}
              />
              <label htmlFor="roster-edit-ids" className="grim-label">
                Stat block ids (one per line or comma-separated)
              </label>
              <textarea
                id="roster-edit-ids"
                className="grim-input mt-1 min-h-[8rem] font-mono text-sm"
                value={editRosterIdsText}
                onChange={(e) => setEditRosterIdsText(e.target.value)}
                placeholder={'goblin\norc-chief'}
              />
              {editRosterErr && (
                <p className="text-blood-400 text-sm mt-2">{editRosterErr}</p>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="grim-btn-ghost"
                  onClick={() => {
                    setEditRosterOpen(false);
                    setEditRosterErr(null);
                    setEditRosterSlug(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="grim-btn-primary"
                  disabled={editRosterBusy}
                  onClick={() => void saveRosterEdit()}
                >
                  {editRosterBusy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="grim-page max-w-xl mx-auto">
      <div className="grim-card p-10 text-center flex flex-col items-center gap-4">
        <div className="rounded-full border border-gold-700/40 bg-ink-900/80 p-4">{icon}</div>
        <div>
          <h2 className="font-display text-xl text-gold-400 tracking-wide">{title}</h2>
          <p className="text-parchment/80 mt-1 max-w-md mx-auto">{description}</p>
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="grim-page max-w-xl mx-auto">
      <div className="grim-card p-8 text-center flex flex-col items-center gap-4 border-blood-700/60">
        <div className="rounded-full border border-blood-700/60 bg-blood-900/40 p-4">
          <SkullIcon className="w-12 h-12 text-blood-400" />
        </div>
        <div>
          <h2 className="font-display text-xl text-blood-400 tracking-wide">The stars are ill</h2>
          <p className="text-parchment/80 mt-1 max-w-md mx-auto text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
