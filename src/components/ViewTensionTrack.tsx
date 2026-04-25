'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadTension, nudgeTension, saveTension } from '@/lib/viewTensionSession';

type Props = {
  viewKey: string;
};

const MAX = 8;

export default function ViewTensionTrack({ viewKey }: Props) {
  const [n, setN] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setN(loadTension(viewKey));
    setReady(true);
  }, [viewKey]);

  const onSlider = useCallback(
    (v: number) => {
      const x = Math.max(0, Math.min(MAX, v));
      setN(x);
      saveTension(viewKey, x);
    },
    [viewKey]
  );

  if (!ready) {
    return (
      <div className="inline-flex items-center gap-1 text-parchment/50 text-xs">Tension…</div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded border border-iron-600/80 bg-ink-900/50 px-2 py-1 text-[0.65rem] text-parchment/90"
      title="Narrative pressure for this scene (0=calm, 8=peak)—your group decides when it matters."
    >
      <span className="text-parchment/55 uppercase tracking-wider">Tension</span>
      <button
        type="button"
        onClick={() => setN(nudgeTension(viewKey, -1))}
        className="w-6 h-6 shrink-0 rounded border border-iron-600/60 text-parchment/80 hover:border-gold-600/60"
        aria-label="Decrease tension"
      >
        −
      </button>
      <input
        type="range"
        min={0}
        max={MAX}
        value={n}
        onChange={(e) => onSlider(parseInt(e.target.value, 10))}
        className="h-1.5 w-20 sm:w-24 cursor-pointer accent-amber-600/90"
        aria-label={`Tension ${n} of ${MAX}`}
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={n}
      />
      <span className="font-mono tabular-nums text-gold-300 w-5 text-center text-sm" aria-hidden>
        {n}
      </span>
      <button
        type="button"
        onClick={() => setN(nudgeTension(viewKey, 1))}
        className="w-6 h-6 shrink-0 rounded border border-iron-600/60 text-parchment/80 hover:border-gold-600/60"
        aria-label="Increase tension"
      >
        +
      </button>
    </div>
  );
}
