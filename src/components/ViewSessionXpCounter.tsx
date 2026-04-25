'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadSessionXp, nudgeSessionXp, saveSessionXp } from '@/lib/viewXpSession';

type Props = {
  viewKey: string;
};

export default function ViewSessionXpCounter({ viewKey }: Props) {
  const [n, setN] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setN(loadSessionXp(viewKey));
    setReady(true);
  }, [viewKey]);

  const set = useCallback(
    (v: number) => {
      const x = Math.max(0, Math.min(999, v));
      setN(x);
      saveSessionXp(viewKey, x);
    },
    [viewKey]
  );

  if (!ready) {
    return (
      <div className="inline-flex items-center gap-1 text-parchment/50 text-xs">XP…</div>
    );
  }

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 gap-y-0.5 rounded border border-iron-600/80 bg-ink-900/50 px-2 py-1 text-[0.65rem] uppercase tracking-wider text-parchment/90"
      role="group"
      aria-label="Session XP scratch (this tab only)"
      title="XP you plan to award or have noted for this table session—not saved to a character sheet or stat block."
    >
      <span className="text-parchment/55">XP</span>
      <button
        type="button"
        onClick={() => setN(nudgeSessionXp(viewKey, -5))}
        className="rounded border border-iron-700/50 px-1 py-0.5 text-[0.55rem] text-parchment/55 hover:border-parchment/25"
        aria-label="Subtract 5"
      >
        −5
      </button>
      <button
        type="button"
        onClick={() => setN(nudgeSessionXp(viewKey, -1))}
        className="w-6 h-6 rounded border border-iron-600/60 text-parchment/80 hover:border-gold-600/60"
        aria-label="Decrease by 1"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={999}
        className="w-10 bg-transparent text-center font-mono tabular-nums text-gold-300 text-sm border-0 p-0"
        value={n}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (Number.isFinite(v)) set(v);
        }}
        aria-label="Session XP"
      />
      <button
        type="button"
        onClick={() => setN(nudgeSessionXp(viewKey, 1))}
        className="w-6 h-6 rounded border border-iron-600/60 text-parchment/80 hover:border-gold-600/60"
        aria-label="Increase by 1"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => setN(nudgeSessionXp(viewKey, 5))}
        className="rounded border border-iron-700/50 px-1 py-0.5 text-[0.55rem] text-parchment/55 hover:border-parchment/25"
        aria-label="Add 5"
      >
        +5
      </button>
    </div>
  );
}
