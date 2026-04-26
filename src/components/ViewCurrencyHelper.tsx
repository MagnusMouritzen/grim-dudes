'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  BRASS_PER_GOLD,
  brassToParts,
  formatWfrpCoinLine,
  formatWfrpSplitLine,
  partsToBrass,
  splitBrassEqually,
} from '@/lib/wfrpCurrency';
import { LinkIcon, ScrollIcon } from './icons';

function parseField(raw: string): number {
  const n = parseInt(String(raw).replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

type Props = { compact?: boolean };

export default function ViewCurrencyHelper({ compact = false }: Props) {
  const [gRaw, setGRaw] = useState('0');
  const [sRaw, setSRaw] = useState('0');
  const [bRaw, setBRaw] = useState('0');
  const [g2Raw, setG2Raw] = useState('0');
  const [s2Raw, setS2Raw] = useState('0');
  const [b2Raw, setB2Raw] = useState('0');
  const [peopleRaw, setPeopleRaw] = useState('1');
  const [copied, setCopied] = useState(false);

  const gold = useMemo(() => parseField(gRaw), [gRaw]);
  const silver = useMemo(() => parseField(sRaw), [sRaw]);
  const brass = useMemo(() => parseField(bRaw), [bRaw]);
  const g2 = useMemo(() => parseField(g2Raw), [g2Raw]);
  const s2 = useMemo(() => parseField(s2Raw), [s2Raw]);
  const b2 = useMemo(() => parseField(b2Raw), [b2Raw]);
  const people = useMemo(() => Math.max(1, parseField(peopleRaw) || 1), [peopleRaw]);

  const totalBrass = useMemo(
    () =>
      partsToBrass(gold, silver, brass) + (compact ? 0 : partsToBrass(g2, s2, b2)),
    [gold, silver, brass, g2, s2, b2, compact]
  );

  const normalized = useMemo(() => {
    if (totalBrass === 0) return { gold: 0, silver: 0, brass: 0 };
    return brassToParts(totalBrass);
  }, [totalBrass]);

  const split = useMemo(
    () => (people >= 2 && totalBrass > 0 ? splitBrassEqually(totalBrass, people) : null),
    [totalBrass, people]
  );

  const line = useMemo(() => {
    const base = formatWfrpCoinLine(normalized) + (totalBrass > 0 ? ` (${totalBrass} brass total)` : '');
    if (!split) return base;
    return `${base}\n${formatWfrpSplitLine(split)}`;
  }, [normalized, totalBrass, split]);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(line).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {}
    );
  }, [line]);

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
        <ScrollIcon className="w-4 h-4" />
        Imperial coin
      </h2>
      <p className={`text-parchment-200/85 mb-2 ${compact ? 'text-[0.65rem] leading-snug' : 'text-xs'}`}>
        {compact
          ? `Normalize: 1 GC = 20 ss = ${BRASS_PER_GOLD} bp.`
          : `Normalize loot or shopping totals: 1 GC = 20 ss = ${BRASS_PER_GOLD} bp. Book rules for
        haggling, quality, and availability still apply.`}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        {!compact && (
          <span className="w-full text-[0.6rem] uppercase text-parchment-300/80 -mb-1">Pile 1</span>
        )}
        <div>
          <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor="wfrp-coin-gc">
            GC
          </label>
          <input
            id="wfrp-coin-gc"
            inputMode="numeric"
            className="grim-input !py-1.5 text-sm w-[4.5rem]"
            value={gRaw}
            onChange={(e) => setGRaw(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor="wfrp-coin-ss">
            ss
          </label>
          <input
            id="wfrp-coin-ss"
            inputMode="numeric"
            className="grim-input !py-1.5 text-sm w-[4.5rem]"
            value={sRaw}
            onChange={(e) => setSRaw(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor="wfrp-coin-bp">
            bp
          </label>
          <input
            id="wfrp-coin-bp"
            inputMode="numeric"
            className="grim-input !py-1.5 text-sm w-[4.5rem]"
            value={bRaw}
            onChange={(e) => setBRaw(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={copy}
          className="grim-btn-ghost !py-1.5 !px-2 text-sm inline-flex items-center gap-1"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {!compact && (
        <>
          <details className="mt-2 border-t border-stone-800/55 pt-2">
            <summary className="text-[0.65rem] uppercase text-parchment-300/80 cursor-pointer select-none">
              Second pile (add)
            </summary>
            <div className="flex flex-wrap items-end gap-2 mt-2">
              <div>
                <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor="wfrp-c2-gc">
                  GC
                </label>
                <input
                  id="wfrp-c2-gc"
                  inputMode="numeric"
                  className="grim-input !py-1.5 text-sm w-[4.5rem]"
                  value={g2Raw}
                  onChange={(e) => setG2Raw(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor="wfrp-c2-ss">
                  ss
                </label>
                <input
                  id="wfrp-c2-ss"
                  inputMode="numeric"
                  className="grim-input !py-1.5 text-sm w-[4.5rem]"
                  value={s2Raw}
                  onChange={(e) => setS2Raw(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor="wfrp-c2-bp">
                  bp
                </label>
                <input
                  id="wfrp-c2-bp"
                  inputMode="numeric"
                  className="grim-input !py-1.5 text-sm w-[4.5rem]"
                  value={b2Raw}
                  onChange={(e) => setB2Raw(e.target.value)}
                />
              </div>
            </div>
          </details>

          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div>
              <label className="text-[0.6rem] uppercase text-parchment-300/80" htmlFor="wfrp-split-n">
                Split among
              </label>
              <input
                id="wfrp-split-n"
                inputMode="numeric"
                className="grim-input !py-1.5 text-sm w-[4.5rem]"
                value={peopleRaw}
                onChange={(e) => setPeopleRaw(e.target.value)}
                min={1}
                aria-describedby="wfrp-split-hint"
              />
            </div>
            <span id="wfrp-split-hint" className="text-[0.65rem] text-parchment-300/80 pb-1.5">
              people (equal shares)
            </span>
          </div>
        </>
      )}

      <p
        className={`mt-2 text-parchment/90 leading-snug border-t border-stone-800/55 pt-2 whitespace-pre-line ${
          compact ? 'text-xs' : 'text-sm'
        }`}
      >
        {line}
      </p>
    </div>
  );
}
