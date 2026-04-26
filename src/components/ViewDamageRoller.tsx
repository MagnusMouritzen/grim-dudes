'use client';

import { useCallback, useState } from 'react';
import { formatNd10LogLine } from '@/lib/poolRollLogLine';
import { rollNd10 } from '@/lib/wfrpRoll';
import { appendCombatLogOneLine } from '@/lib/viewCombatLog';
import { SwordsIcon } from './icons';

type Props = {
  compact?: boolean;
  /** When set, append last damage pool to Combat & scene log. */
  logKey?: string;
};

export default function ViewDamageRoller({ compact = false, logKey }: Props) {
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
    const { rolls, subtotal } = rollNd10(n);
    const total = subtotal + mod;
    setLast({ rolls, subtotal, mod, total });
  }, [diceCountStr, modStr]);

  const appendToLog = useCallback(() => {
    if (!logKey || !last) return;
    appendCombatLogOneLine(logKey, formatNd10LogLine(last.rolls, last.subtotal, last.mod, last.total));
  }, [logKey, last]);

  const nid = compact ? 'nd10-n-compact' : 'nd10-n';
  const mid = compact ? 'nd10-mod-compact' : 'nd10-mod';

  return (
    <div
      className={`grim-card print:hidden border-stone-700/65 ${compact ? 'p-3' : 'p-4'}`}
    >
      <h2
        className={`font-display text-gold-400/95 uppercase tracking-wider flex items-center gap-2 ${compact ? 'text-xs mb-1.5' : 'text-sm mb-2'}`}
      >
        <SwordsIcon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Nd10 + mod
      </h2>
      {!compact && (
        <p className="text-parchment-200/85 text-xs mb-3">
          Sum d10s (WFRP damage, misc pools). Add Strength Bonus, slays, or other modifiers in the
          second field. Minimum damage and crit steps still use your book.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor={nid}>
            # d10
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
          <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor={mid}>
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
