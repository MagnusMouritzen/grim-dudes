'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getRememberedRoster,
  LAST_ENCOUNTER_EVENT,
  type RememberedRoster,
} from '@/lib/lastEncounterStorage';
import { ScrollIcon } from './icons';

const MAX = 22;

function trunc(s: string): string {
  if (s.length <= MAX) return s;
  return `${s.slice(0, MAX - 1)}…`;
}

/**
 * “Resume” link when the GM recently opened a saved encounter roster; reads localStorage (client only).
 */
export default function LastEncounterNav() {
  const [r, setR] = useState<RememberedRoster | null>(null);

  useEffect(() => {
    const load = () => setR(getRememberedRoster());
    load();
    window.addEventListener(LAST_ENCOUNTER_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(LAST_ENCOUNTER_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, []);

  if (r == null) return null;

  const href = `/view?roster=${encodeURIComponent(r.slug)}`;

  return (
    <Link
      href={href}
      className="inline-flex max-w-[10rem] sm:max-w-[14rem] items-center gap-1 rounded border border-iron-700/70 bg-ink-900/40 px-2 py-1 text-[0.6rem] uppercase tracking-wider text-parchment/65 hover:text-gold-400/90 hover:border-gold-700/50 transition-colors"
      title={`Open last encounter: ${r.name}`}
    >
      <ScrollIcon className="w-3 h-3 shrink-0 opacity-80" />
      <span className="truncate">
        Last: <span className="text-parchment/80 normal-case tracking-normal">{trunc(r.name)}</span>
      </span>
    </Link>
  );
}
