'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadRound, saveRound, subscribeRound } from '@/lib/viewRoundSession';

type Props = {
  viewKey: string;
};

export default function ViewRoundCounter({ viewKey }: Props) {
  const [round, setRound] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRound(loadRound(viewKey));
    setReady(true);
    return subscribeRound(viewKey, () => {
      setRound(loadRound(viewKey));
    });
  }, [viewKey]);

  const set = useCallback(
    (n: number) => {
      const v = Math.max(1, Math.min(9999, n));
      setRound(v);
      saveRound(viewKey, v);
    },
    [viewKey]
  );

  if (!ready) {
    return (
      <div className="inline-flex items-center gap-1 text-parchment/50 text-xs">Round…</div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded border border-iron-600/80 bg-ink-900/50 px-2 py-1 text-[0.65rem] uppercase tracking-wider text-parchment/90"
      role="group"
      aria-label="Combat round (this tab only)"
    >
      <span className="text-parchment/55">Round</span>
      <button
        type="button"
        onClick={() => set(round - 1)}
        disabled={round <= 1}
        className="w-6 h-6 rounded border border-iron-600/60 text-parchment/80 hover:border-gold-600/60 disabled:opacity-30"
        aria-label="Previous round"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={9999}
        className="w-11 bg-transparent text-center font-mono tabular-nums text-gold-300 text-sm border-0 p-0"
        value={round}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) set(n);
        }}
        aria-label="Round number"
      />
      <button
        type="button"
        onClick={() => set(round + 1)}
        className="w-6 h-6 rounded border border-iron-600/60 text-parchment/80 hover:border-gold-600/60"
        aria-label="Next round"
      >
        +
      </button>
    </div>
  );
}
