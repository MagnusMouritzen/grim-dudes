'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadCorruption, nudgeCorruption, saveCorruption } from '@/lib/viewCorruptionSession';

type Props = {
  viewKey: string;
};

export default function ViewCorruptionCounter({ viewKey }: Props) {
  const [n, setN] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setN(loadCorruption(viewKey));
    setReady(true);
  }, [viewKey]);

  const set = useCallback(
    (v: number) => {
      const x = Math.max(0, Math.min(99, v));
      setN(x);
      saveCorruption(viewKey, x);
    },
    [viewKey]
  );

  if (!ready) {
    return (
      <div className="inline-flex items-center gap-1 text-parchment-300/75 text-xs">Corruption…</div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded border border-stone-600/85 bg-ink-900/50 px-2 py-1 text-[0.65rem] uppercase tracking-wider text-parchment/90"
      role="group"
      aria-label="Corruption scratch (this tab only)"
      title="On-the-fly taint, corruption pressure, or similar—use your rulebook for what the number means."
    >
      <span className="text-parchment-300/85">Corruption</span>
      <button
        type="button"
        onClick={() => setN(nudgeCorruption(viewKey, -1))}
        className="w-6 h-6 rounded border border-stone-600/70 text-parchment/80 hover:border-gold-600/60"
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
        aria-label="Corruption scratch"
      />
      <button
        type="button"
        onClick={() => setN(nudgeCorruption(viewKey, 1))}
        className="w-6 h-6 rounded border border-stone-600/70 text-parchment/80 hover:border-gold-600/60"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
