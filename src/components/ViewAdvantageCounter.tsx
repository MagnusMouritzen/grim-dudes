'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadAdvantage, nudgeAdvantage, saveAdvantage } from '@/lib/viewAdvantageSession';

const MAX = 10;

type Props = {
  viewKey: string;
};

export default function ViewAdvantageCounter({ viewKey }: Props) {
  const [n, setN] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setN(loadAdvantage(viewKey));
    setReady(true);
  }, [viewKey]);

  const set = useCallback(
    (v: number) => {
      const x = Math.max(0, Math.min(MAX, v));
      setN(x);
      saveAdvantage(viewKey, x);
    },
    [viewKey]
  );

  if (!ready) {
    return (
      <div className="inline-flex items-center gap-1 text-parchment/50 text-xs">Adv…</div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded border border-iron-600/80 bg-ink-900/50 px-2 py-1 text-[0.65rem] uppercase tracking-wider text-parchment/90"
      role="group"
      aria-label="Advantage scratch (this tab only)"
      title="Rough combat Advantage for whichever side you are tracking—your rulebook defines caps and when it changes."
    >
      <span className="text-parchment/55">Adv</span>
      <button
        type="button"
        onClick={() => setN(nudgeAdvantage(viewKey, -1))}
        className="w-6 h-6 rounded border border-iron-600/60 text-parchment/80 hover:border-gold-600/60"
        aria-label="Decrease"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={MAX}
        className="w-7 bg-transparent text-center font-mono tabular-nums text-gold-300 text-sm border-0 p-0"
        value={n}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (Number.isFinite(v)) set(v);
        }}
        aria-label="Advantage"
      />
      <button
        type="button"
        onClick={() => setN(nudgeAdvantage(viewKey, 1))}
        className="w-6 h-6 rounded border border-iron-600/60 text-parchment/80 hover:border-gold-600/60"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
