'use client';

import { useMemo, useState } from 'react';
import { getGmConditions, searchGmConditions } from '@/lib/gmConditions';
import { SearchIcon, ScrollIcon } from './icons';

export default function ViewConditionRef() {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => (q.trim() ? searchGmConditions(q) : getGmConditions()), [q]);

  return (
    <div className="grim-card p-4 print:hidden border-iron-700/50">
      <h2 className="font-display text-gold-400/95 text-sm uppercase tracking-wider flex items-center gap-2 mb-2">
        <ScrollIcon className="w-4 h-4" />
        Condition hints
      </h2>
      <p className="text-parchment/55 text-xs mb-2">
        Short reminders to jog memory—open your <em>WFRP 4e</em> book for full rules, durations, and tests.
      </p>
      <div className="relative mb-2">
        <label htmlFor="cond-search" className="sr-only">
          Search conditions
        </label>
        <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-parchment/40" />
        <input
          id="cond-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter…"
          className="grim-input !pl-8 !py-1.5 text-sm"
        />
      </div>
      <ul
        className="max-h-52 overflow-y-auto space-y-1.5 pr-1 text-sm border-t border-iron-800/50 pt-2"
        aria-label="Condition hints"
      >
        {filtered.length === 0 ? (
          <li className="text-parchment/50 text-xs">No matches.</li>
        ) : (
          filtered.map((c) => (
            <li key={c.id} className="border-b border-iron-800/30 pb-1.5 last:border-0">
              <span className="text-gold-400/90 font-medium">{c.name}</span>
              <span className="text-parchment/75 block text-xs mt-0.5 leading-snug">{c.hint}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
