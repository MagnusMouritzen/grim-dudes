'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadFortune, nudgeFortune, saveFortune } from '@/lib/viewFortuneSession';

type Props = {
  viewKey: string;
};

export default function ViewFortuneCounter({ viewKey }: Props) {
  const [n, setN] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setN(loadFortune(viewKey));
    setReady(true);
  }, [viewKey]);

  const set = useCallback(
    (v: number) => {
      const x = Math.max(0, Math.min(99, v));
      setN(x);
      saveFortune(viewKey, x);
    },
    [viewKey]
  );

  if (!ready) {
    return (
      <div className="inline-flex items-center gap-1 text-parchment/50 text-xs">Fortune…</div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded border border-iron-600/80 bg-ink-900/50 px-2 py-1 text-[0.65rem] uppercase tracking-wider text-parchment/90"
      role="group"
      aria-label="Fortune scratch counter (this tab only)"
      title="Scratch aid for who might still have Fortune (or similar)—not synced to character sheets. Your rulebook defines Fortune."
    >
      <span className="text-parchment/55">Fortune</span>
      <button
        type="button"
        onClick={() => setN(nudgeFortune(viewKey, -1))}
        className="w-6 h-6 rounded border border-iron-600/60 text-parchment/80 hover:border-gold-600/60"
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={99}
        className="w-9 bg-transparent text-center font-mono tabular-nums text-gold-300 text-sm border-0 p-0"
        value={n}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (Number.isFinite(v)) set(v);
        }}
        aria-label="Fortune count"
      />
      <button
        type="button"
        onClick={() => setN(nudgeFortune(viewKey, 1))}
        className="w-6 h-6 rounded border border-iron-600/60 text-parchment/80 hover:border-gold-600/60"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
