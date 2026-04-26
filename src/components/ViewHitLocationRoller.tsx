'use client';

import { useCallback, useState } from 'react';
import { humanoidHitLocation } from '@/lib/wfrpHitLocation';
import { rollD100 } from '@/lib/wfrpRoll';
import { appendCombatLogOneLine } from '@/lib/viewCombatLog';
import { LinkIcon, SkullIcon } from './icons';

type Props = {
  compact?: boolean;
  logKey?: string;
};

/** Random body location (humanoid) on d100—use your book for hits that matter mechanically. */
export default function ViewHitLocationRoller({ compact = false, logKey }: Props) {
  const [last, setLast] = useState<{ roll: number; label: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const roll = useCallback(() => {
    const r = rollD100();
    setLast(humanoidHitLocation(r));
  }, []);

  const line = last ? `Hit location (d100): ${last.roll} — ${last.label}` : '';

  const copy = useCallback(() => {
    if (!line) return;
    void navigator.clipboard.writeText(line).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {}
    );
  }, [line]);

  const toLog = useCallback(() => {
    if (!logKey || !line) return;
    appendCombatLogOneLine(logKey, line);
  }, [logKey, line]);

  return (
    <div
      className={`grim-card print:hidden border-iron-700/50 ${compact ? 'p-3' : 'p-4'}`}
    >
      <h2
        className={`font-display text-gold-400/95 uppercase tracking-wider flex items-center gap-2 ${
          compact ? 'text-xs mb-1.5' : 'text-sm mb-2'
        }`}
      >
        <SkullIcon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Hit location
      </h2>
      {!compact && (
        <p className="text-parchment/55 text-xs mb-3">
          Humanoid: roll d100, read the band. Check your <strong className="text-parchment/80">WFRP 4e</strong>{' '}
          book for the official table, armour at each location, and crit results—this is a table aid only.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={roll}
          className={`grim-btn-primary text-sm ${compact ? '!py-1 !px-2.5' : '!py-1.5 !px-3'}`}
        >
          d100
        </button>
        {last && (
          <>
            <span className="text-parchment/90 text-sm font-mono tabular-nums" aria-live="polite">
              {last.roll} → <span className="text-gold-300/95">{last.label}</span>
            </span>
            <button
              type="button"
              onClick={copy}
              className="grim-btn-ghost !py-1.5 !px-2 text-sm inline-flex items-center gap-1"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </button>
            {logKey && (
              <button type="button" onClick={toLog} className="grim-btn-ghost !py-1.5 !px-2.5 text-sm">
                To log
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
