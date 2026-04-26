'use client';

import { useCallback, useState } from 'react';
import type { GmImprovTableId } from '@/lib/gmImprov';
import { pickGmImprov } from '@/lib/gmImprov';
import { LinkIcon, ScrollIcon } from './icons';

const LABELS: Record<GmImprovTableId, string> = {
  name: 'Name',
  complication: 'Complication',
  atmosphere: 'Atmosphere',
  weather: 'Weather',
  street: 'Street',
  rumour: 'Rumour',
  motive: 'Motive',
  voice: 'Voice',
  twist: 'Twist',
};

export default function ViewGmImprov() {
  const [table, setTable] = useState<GmImprovTableId>('complication');
  const [last, setLast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const draw = useCallback(() => {
    setLast(pickGmImprov(table));
  }, [table]);

  const copy = useCallback(() => {
    if (!last) return;
    void navigator.clipboard.writeText(last).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {}
    );
  }, [last]);

  return (
    <div className="grim-card p-4 print:hidden border-stone-700/65">
      <h2 className="font-display text-gold-400/95 text-sm uppercase tracking-wider flex items-center gap-2 mb-2">
        <ScrollIcon className="w-4 h-4" />
        Improv (original)
      </h2>
      <p className="text-parchment-200/85 text-xs mb-2">
        Random prompts for NPCs and scenes—pair with your rulebook for tests and consequences.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor="gm-improv-table">
            Table
          </label>
          <select
            id="gm-improv-table"
            className="grim-input !py-1.5 text-sm min-w-[10rem]"
            value={table}
            onChange={(e) => setTable(e.target.value as GmImprovTableId)}
          >
            {(Object.keys(LABELS) as GmImprovTableId[]).map((id) => (
              <option key={id} value={id}>
                {LABELS[id]}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={draw} className="grim-btn-primary !py-1.5 !px-3 text-sm">
          Draw
        </button>
        {last && (
          <button
            type="button"
            onClick={copy}
            className="grim-btn-ghost !py-1.5 !px-2 text-sm inline-flex items-center gap-1"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      {last && (
        <p className="mt-2 text-parchment/90 text-sm leading-snug border-t border-stone-800/55 pt-2">
          {last}
        </p>
      )}
    </div>
  );
}
