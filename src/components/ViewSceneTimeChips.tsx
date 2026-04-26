'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadSceneTime, saveSceneTime, type SceneTimeId } from '@/lib/viewSceneTimeSession';

const CHIPS: { id: SceneTimeId; label: string }[] = [
  { id: '', label: 'Off' },
  { id: 'dawn', label: 'Dawn' },
  { id: 'day', label: 'Day' },
  { id: 'dusk', label: 'Dusk' },
  { id: 'night', label: 'Night' },
  { id: 'late', label: 'Late' },
];

type Props = {
  viewKey: string;
  /** Narrow stat-page layout: one dropdown instead of chip row. */
  compact?: boolean;
};

export default function ViewSceneTimeChips({ viewKey, compact = false }: Props) {
  const [v, setV] = useState<SceneTimeId>('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setV(loadSceneTime(viewKey));
    setReady(true);
  }, [viewKey]);

  const pick = useCallback(
    (id: SceneTimeId) => {
      setV(id);
      saveSceneTime(viewKey, id);
    },
    [viewKey]
  );

  if (!ready) {
    return <span className="text-parchment-300/80 text-[0.65rem]">Time…</span>;
  }

  const title =
    'Fiction time for this tab—used in Copy turn, initiative copies, and session bundle when there is no initiative list.';

  if (compact) {
    return (
      <div
        className="grim-card p-3 print:hidden border-stone-700/65 w-full"
        title={title}
      >
        <h2 className="font-display text-gold-400/95 text-xs uppercase tracking-wider mb-2">Scene time</h2>
        <label htmlFor="view-scene-time-compact" className="text-[0.6rem] uppercase text-parchment-300/80 block mb-1">
          When (fiction)
        </label>
        <select
          id="view-scene-time-compact"
          className="grim-input !py-1.5 text-sm w-full max-w-xs"
          value={v}
          onChange={(e) => pick(e.target.value as SceneTimeId)}
        >
          {CHIPS.map(({ id, label }) => (
            <option key={id || 'off'} value={id}>
              {id === '' ? '— Off —' : label}
            </option>
          ))}
        </select>
        <p className="text-parchment-300/80 text-[0.65rem] mt-1.5 leading-snug">Included in session copy for this page.</p>
      </div>
    );
  }

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded border border-stone-600/85 bg-ink-900/50 px-2 py-1 text-[0.65rem] text-parchment/90"
      title={title}
    >
      <span className="text-parchment-300/85 uppercase tracking-wider shrink-0">Time</span>
      {CHIPS.map(({ id, label }) => (
        <button
          key={id || 'off'}
          type="button"
          onClick={() => pick(id)}
          className={`rounded px-1.5 py-0.5 border ${
            v === id
              ? 'border-gold-600/50 text-gold-300/90 bg-ink-800/80'
              : 'border-stone-700/65 text-parchment-300/80 hover:border-parchment/25'
          }`}
          aria-pressed={v === id}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
