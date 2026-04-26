'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getLastEncounter,
  LAST_ENCOUNTER_EVENT,
  type LastEncounter,
} from '@/lib/lastEncounterStorage';
import { ScrollIcon } from './icons';

const MAX = 22;

function trunc(s: string): string {
  if (s.length <= MAX) return s;
  return `${s.slice(0, MAX - 1)}…`;
}

function label(e: LastEncounter): string {
  if (e.kind === 'roster') return e.name;
  if (e.title) return e.title;
  return `${e.ids.length} stat block${e.ids.length === 1 ? '' : 's'}`;
}

function hrefFor(e: LastEncounter): string {
  if (e.kind === 'roster') {
    return `/view?roster=${encodeURIComponent(e.slug)}`;
  }
  const q = e.ids.map(encodeURIComponent).join(',');
  const t = e.title;
  if (t) return `/view?ids=${q}&title=${encodeURIComponent(t)}`;
  return `/view?ids=${q}`;
}

/**
 * “Resume” for last opened saved roster or ad-hoc ids /view; reads localStorage (client only).
 */
export default function LastEncounterNav() {
  const [r, setR] = useState<LastEncounter | null>(null);

  useEffect(() => {
    const load = () => setR(getLastEncounter());
    load();
    window.addEventListener(LAST_ENCOUNTER_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(LAST_ENCOUNTER_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, []);

  if (r == null) return null;

  const h = hrefFor(r);
  const lb = label(r);
  const kindHint = r.kind === 'roster' ? 'saved roster' : 'ad-hoc list';

  return (
    <Link
      href={h}
      className="inline-flex max-w-[10rem] sm:max-w-[14rem] items-center gap-1 rounded border border-iron-700/70 bg-ink-900/40 px-2 py-1 text-[0.6rem] uppercase tracking-wider text-parchment/65 hover:text-gold-400/90 hover:border-gold-700/50 transition-colors"
      title={`Open last encounter (${kindHint}): ${lb}`}
    >
      <ScrollIcon className="w-3 h-3 shrink-0 opacity-80" />
      <span className="truncate">
        Last: <span className="text-parchment/80 normal-case tracking-normal">{trunc(lb)}</span>
      </span>
    </Link>
  );
}
