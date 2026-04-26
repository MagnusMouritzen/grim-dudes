'use client';

import { useCallback, useState } from 'react';
import { appendCombatLogOneLine } from '@/lib/viewCombatLog';
import { d100TensOnes, resolveOpposedD100, rollOpposedD100 } from '@/lib/wfrpRoll';
import { DiceIcon, LinkIcon } from './icons';

function parseTarget(raw: string): number | null {
  const t = parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(t) || t < 1 || t > 100) return null;
  return t;
}

type Props = {
  compact?: boolean;
  logKey?: string;
};

export default function ViewOpposedD100({ compact = false, logKey }: Props) {
  const [tA, setTA] = useState('');
  const [tB, setTB] = useState('');
  const [a, setA] = useState<number | null>(null);
  const [b, setB] = useState<number | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const roll = useCallback(() => {
    const { a: ra, b: rb } = rollOpposedD100();
    setA(ra);
    setB(rb);
    const ta = parseTarget(tA);
    const tb = parseTarget(tB);
    setSummary(resolveOpposedD100(ra, rb, ta, tb).summary);
  }, [tA, tB]);

  const dA = a != null ? d100TensOnes(a) : null;
  const dB = b != null ? d100TensOnes(b) : null;

  const line = (() => {
    if (a == null || b == null || dA == null || dB == null) return '';
    return `Opposed d100: A ${a} (${dA.tens}/${dA.ones}), B ${b} (${dB.tens}/${dB.ones}). ${summary ?? ''}`;
  })();

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
      className={`grim-card print:hidden border-stone-700/65 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <h2
        className={`font-display text-gold-400/95 uppercase tracking-wider flex items-center gap-2 mb-2 ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        <DiceIcon className="w-4 h-4" />
        Opposed d100
      </h2>
      <p className={`text-parchment-200/85 mb-2 ${compact ? 'text-[0.65rem] leading-snug' : 'text-xs'}`}>
        Two rolls for contests; optional 1–100 targets for a quick pass/fail read. Your book still
        handles Success Levels, crits, and two-fail opposed steps.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor="opp-ta">
            A target
          </label>
          <input
            id="opp-ta"
            type="number"
            min={1}
            max={100}
            className="grim-input w-[4.5rem] !py-1.5 text-sm font-mono tabular-nums"
            value={tA}
            onChange={(e) => setTA(e.target.value)}
            placeholder="—"
          />
        </div>
        <div>
          <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor="opp-tb">
            B target
          </label>
          <input
            id="opp-tb"
            type="number"
            min={1}
            max={100}
            className="grim-input w-[4.5rem] !py-1.5 text-sm font-mono tabular-nums"
            value={tB}
            onChange={(e) => setTB(e.target.value)}
            placeholder="—"
          />
        </div>
        <button
          type="button"
          onClick={roll}
          className={`grim-btn-primary text-sm ${compact ? '!py-1 !px-2.5' : '!py-1.5 !px-3'}`}
        >
          Roll both
        </button>
        {a != null && b != null && (
          <>
            <button
              type="button"
              onClick={copy}
              className="grim-btn-ghost !py-1.5 !px-2 text-sm inline-flex items-center gap-1"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </button>
            {logKey && (
              <button
                type="button"
                onClick={toLog}
                className="grim-btn-ghost !py-1.5 !px-2.5 text-sm"
                title="Append to Combat & scene log on this page"
              >
                To log
              </button>
            )}
          </>
        )}
      </div>
      {a != null && b != null && dA != null && dB != null && (
        <div
          className={`mt-2 border-t border-stone-800/55 pt-2 space-y-1 ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          <p className="font-mono text-gold-300/95 tabular-nums">
            A: {a}{' '}
            <span className="text-parchment-300/80 text-[0.7rem]">
              (tens/ones {dA.tens}/{dA.ones})
            </span>
          </p>
          <p className="font-mono text-gold-300/95 tabular-nums">
            B: {b}{' '}
            <span className="text-parchment-300/80 text-[0.7rem]">
              (tens/ones {dB.tens}/{dB.ones})
            </span>
          </p>
          {summary && <p className="text-parchment/80 leading-snug">{summary}</p>}
        </div>
      )}
    </div>
  );
}
