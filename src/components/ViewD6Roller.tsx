'use client';

import { useState, useCallback } from 'react';
import { formatNd6LogLine } from '@/lib/poolRollLogLine';
import { rollNd6 } from '@/lib/wfrpRoll';
import { appendCombatLogOneLine } from '@/lib/viewCombatLog';
import { DiceIcon } from './icons';

type Props = {
  compact?: boolean;
  /** When set, you can append the last pool to Combat & scene log (same key as /view). */
  logKey?: string;
};

/** Generic d6 pool for table lookups and loose rolls — not a substitute for book procedures. */
export default function ViewD6Roller({ compact = false, logKey }: Props) {
  const [diceCountStr, setDiceCountStr] = useState('1');
  const [modStr, setModStr] = useState('0');
  const [last, setLast] = useState<{
    rolls: number[];
    subtotal: number;
    mod: number;
    total: number;
  } | null>(null);

  const roll = useCallback(() => {
    const n = parseInt(diceCountStr.trim(), 10);
    if (!Number.isFinite(n) || n < 1) {
      setLast(null);
      return;
    }
    const m = parseInt(modStr.trim(), 10);
    const mod = Number.isFinite(m) ? m : 0;
    const { rolls, subtotal } = rollNd6(n);
    const total = subtotal + mod;
    setLast({ rolls, subtotal, mod, total });
  }, [diceCountStr, modStr]);

  const appendToLog = useCallback(() => {
    if (!logKey || !last) return;
    appendCombatLogOneLine(logKey, formatNd6LogLine(last.rolls, last.subtotal, last.mod, last.total));
  }, [logKey, last]);

  const nid = compact ? 'nd6-n-compact' : 'nd6-n';
  const mid = compact ? 'nd6-mod-compact' : 'nd6-mod';

  return (
    <div
      className={`grim-card print:hidden border-iron-700/50 ${compact ? 'p-3' : 'p-4'}`}
    >
      <h2
        className={`font-display text-gold-400/95 uppercase tracking-wider flex items-center gap-2 ${compact ? 'text-xs mb-1.5' : 'text-sm mb-2'}`}
      >
        <DiceIcon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Nd6 + mod
      </h2>
      {!compact && (
        <p className="text-parchment/55 text-xs mb-3">
          Sum d6s for ad-hoc tables or house rules. Use your rulebook for anything that specifies a
          procedure (e.g. Fortune, structured miscasts).
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-[0.6rem] uppercase text-parchment/45" htmlFor={nid}>
            # d6
          </label>
          <input
            id={nid}
            type="number"
            min={1}
            max={20}
            className={`grim-input w-20 font-mono tabular-nums ${compact ? '!py-1' : '!py-1.5'}`}
            value={diceCountStr}
            onChange={(e) => setDiceCountStr(e.target.value)}
            placeholder="1"
          />
        </div>
        <div>
          <label className="text-[0.6rem] uppercase text-parchment/45" htmlFor={mid}>
            + mod
          </label>
          <input
            id={mid}
            type="number"
            className={`grim-input w-20 font-mono tabular-nums ${compact ? '!py-1' : '!py-1.5'}`}
            value={modStr}
            onChange={(e) => setModStr(e.target.value)}
            placeholder="0"
          />
        </div>
        <button
          type="button"
          onClick={roll}
          className={`grim-btn-primary text-sm ${compact ? '!py-1 !px-2.5' : '!py-1.5 !px-3'}`}
        >
          Roll
        </button>
        {logKey && last && (
          <button
            type="button"
            onClick={appendToLog}
            className={`grim-btn-ghost text-sm ${compact ? '!py-1 !px-2' : '!py-1.5 !px-2.5'}`}
            title="Append this result (timestamped) to Combat & scene log"
          >
            To log
          </button>
        )}
        {last && (
          <div className="min-w-0 flex-1 basis-full sm:basis-auto">
            <p
              className={`font-mono text-gold-300 tabular-nums ${compact ? 'text-xl' : 'text-2xl'}`}
              aria-live="polite"
            >
              {last.total}
            </p>
            <p
              className={`text-parchment/75 ${compact ? 'text-[0.7rem] leading-snug' : 'text-xs'} mt-0.5`}
            >
              {last.rolls.join(' + ')} = {last.subtotal}
              {last.mod !== 0
                ? ` ${last.mod >= 0 ? '+' : '−'} ${Math.abs(last.mod)} = ${last.total}`
                : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
