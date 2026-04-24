'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
import { ChevronIcon, EditIcon, PrinterIcon, SkullIcon, TrashIcon } from './icons';

const API = '/api';

export default function StatBlockView() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
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
  const confirmRef = useRef<HTMLDivElement | null>(null);
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
        setBlock((blockData as Statblock) ?? null);
        setSkillsRef(Array.isArray(skillsData) ? (skillsData as SkillRef[]) : []);
        setTraitsRef(Array.isArray(traitsData) ? (traitsData as TraitRef[]) : []);
        setWeaponsRef((weaponsData as WeaponsRef | null) || null);
        setArmourRef((armourData as ArmourRef | null) || null);
        setCareersRef((careersData as CareersRef | null) || null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
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

  const handleDelete = () => {
    if (!id) return;
    setDeleting(true);
    fetch(`${API}/statblocks/${encodeURIComponent(id)}`, { method: 'DELETE' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to delete');
        router.push('/');
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
        setDeleting(false);
      });
  };

  if (loading) {
    return (
      <div className="max-w-xl lg:max-w-md xl:max-w-lg mx-auto grim-card shimmer h-80 p-6">
        <div className="h-6 w-1/2 bg-ink-900/80 rounded mb-3" />
        <div className="h-40 w-full bg-ink-900/60 rounded" />
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
      <div className="flex items-center justify-between mb-5 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-parchment/70 hover:text-gold-400 text-xs uppercase tracking-wider transition-colors duration-fast"
        >
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" />
          Bestiary
        </Link>
        <div className="flex gap-2 relative">
          <button
            type="button"
            onClick={() => window.print()}
            className="grim-btn-ghost"
            aria-label="Print"
          >
            <PrinterIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <Link
            href={`/statblock/${encodeURIComponent(id ?? '')}/edit`}
            className="grim-btn-ghost"
          >
            <EditIcon className="w-3.5 h-3.5" />
            Edit
          </Link>
          <div className="relative" ref={confirmRef}>
            <button
              type="button"
              onClick={() => setConfirmOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={confirmOpen}
              className="inline-flex items-center gap-1.5 rounded border border-blood-500/70 bg-blood-800/60 px-3 py-1.5 text-parchment text-xs uppercase tracking-wider transition-all duration-fast ease-grim hover:bg-blood-600"
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
        </div>
      </div>

      <motion.article
        initial={rise.initial}
        animate={rise.animate}
        transition={rise.transition}
        className="max-w-xl lg:max-w-md xl:max-w-lg mx-auto"
      >
        <StatBlockCard
          block={block}
          dense
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
