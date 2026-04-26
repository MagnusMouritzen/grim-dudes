'use client';

import { useEffect, useState, useCallback } from 'react';
import { computeEffectiveStats } from '@/lib/statblockDerived';
import type { Statblock, TraitRef } from '@/lib/types';

type Props = {
  viewKey: string;
  block: Statblock;
  traitsRef: TraitRef[] | undefined;
  dense?: boolean;
};

const PREFIX = 'grim-dudes:wounds:';

export default function MultiViewWoundBar({ viewKey, block, traitsRef, dense }: Props) {
  const { effectiveWounds } = computeEffectiveStats(block, traitsRef);
  const max = Math.max(0, Math.floor(effectiveWounds));
  const id = String(block.id ?? '');
  const storageKey = `${PREFIX}${viewKey}:${id}`;

  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    if (max <= 0) {
      setCurrent(0);
      return;
    }
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw == null) {
        setCurrent(max);
        return;
      }
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n)) {
        setCurrent(max);
        return;
      }
      setCurrent(Math.min(max, Math.max(0, n)));
    } catch {
      setCurrent(max);
    }
  }, [storageKey, max]);

  const persist = useCallback(
    (next: number) => {
      const v = max <= 0 ? 0 : Math.min(max, Math.max(0, next));
      setCurrent(v);
      try {
        sessionStorage.setItem(storageKey, String(v));
      } catch {
        // ignore private mode
      }
    },
    [max, storageKey]
  );

  if (id === '' || max <= 0 || current === null) {
    return null;
  }

  return (
    <div
      className={
        dense
          ? 'flex flex-wrap items-center gap-1.5 justify-end text-[0.7rem] print:hidden'
          : 'flex flex-wrap items-center gap-2 justify-end text-sm print:hidden'
      }
    >
      <span className="text-parchment-300/85 font-mono uppercase tracking-wider text-[0.65rem]">
        Wounds
      </span>
      <button
        type="button"
        className="rounded border border-stone-600 px-2 py-0.5 text-parchment-50/95 hover:border-gold-500 hover:text-gold-300 transition-[border-color,color,background-color] duration-base ease-grim"
        aria-label="Reduce wounds"
        onClick={() => persist(current - 1)}
      >
        −
      </button>
      <span className="font-mono tabular-nums text-parchment min-w-[3.5ch] text-center">
        {current} / {max}
      </span>
      <button
        type="button"
        className="rounded border border-stone-600 px-2 py-0.5 text-parchment-50/95 hover:border-gold-500 hover:text-gold-300 transition-[border-color,color,background-color] duration-base ease-grim"
        aria-label="Increase wounds"
        onClick={() => persist(current + 1)}
        disabled={current >= max}
      >
        +
      </button>
    </div>
  );
}
