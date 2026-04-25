'use client';

import { useState, useCallback, useEffect } from 'react';
import { d100TensOnes, rollD100, simpleTestVsTarget } from '@/lib/wfrpRoll';
import { appendCombatLogOneLine } from '@/lib/viewCombatLog';
import {
  clearD100History,
  formatD100HistoryEntry,
  loadD100History,
  pushD100Roll,
  type D100HistoryEntry,
} from '@/lib/viewD100History';
import { DiceIcon } from './icons';

/** Optional reminder of what the roll is for (no rules—your book sets DCs and outcomes). */
const ROLL_CONTEXT_TAGS = [
  'Athletics',
  'Charm',
  'Channelling',
  'Cool',
  'Dodge',
  'Intimidation',
  'Intuition',
  'Lore',
  'Melee',
  'Perception',
  'Pray',
  'Ranged',
  'Stealth',
] as const;

type Props = {
  /** Tighter layout for single stat block page */
  compact?: boolean;
  /** When set, last rolls are kept in session (this tab) for at-a-glance recall. */
  historyKey?: string;
};

export default function ViewDiceRoller({ compact = false, historyKey }: Props) {
  const [targetStr, setTargetStr] = useState('');
  const [contextTag, setContextTag] = useState<(typeof ROLL_CONTEXT_TAGS)[number] | null>(null);
  const [last, setLast] = useState<{ result: number; details: string } | null>(null);
  const [rollHistory, setRollHistory] = useState<D100HistoryEntry[]>([]);

  useEffect(() => {
    if (!historyKey) {
      setRollHistory([]);
      return;
    }
    setRollHistory(loadD100History(historyKey));
  }, [historyKey]);

  const roll = useCallback(() => {
    const r = rollD100();
    const { tens, ones } = d100TensOnes(r);
    const digitLine = `Tens/ones: ${tens} / ${ones} (for reverse-style d100 table lookups).`;
    const ctxLead = contextTag ? `Context: ${contextTag}. ` : '';
    const trimmed = targetStr.trim();
    const t = trimmed === '' ? null : parseInt(trimmed, 10);

    let details: string;
    if (trimmed === '') {
      details = `${ctxLead}d100. ${digitLine} Enter a 1–100 target to test roll ≤ target (after your modifiers).`;
    } else if (t == null || !Number.isFinite(t) || t < 1 || t > 100) {
      details = `${ctxLead}${digitLine} Target must be 1–100 (or clear the field to roll only).`;
    } else {
      const o = simpleTestVsTarget(r, t);
      const crit =
        r === 1
          ? ' (many tables: critical success on 01)'
          : r === 100
            ? ' (many tables: check fumble / crit fail on 100)'
            : '';
      details = `${ctxLead}${digitLine} ${o.success
        ? `vs ${o.target} — success${crit}. Rough margin: ${o.marginTens >= 0 ? '+' : ''}${o.marginTens} (tens).`
        : `vs ${o.target} — failure${crit}.`}`;
    }

    setLast({ result: r, details });
    if (historyKey) {
      setRollHistory(pushD100Roll(historyKey, r, contextTag));
    }
  }, [contextTag, targetStr, historyKey]);

  const tid = compact ? 'd100-target-compact' : 'd100-target';

  const appendRollToSceneLog = useCallback(() => {
    if (!historyKey || !last) return;
    let line = `d100: ${last.result}`;
    if (contextTag) line += ` (${contextTag})`;
    const trimmed = targetStr.trim();
    const t = trimmed === '' ? null : parseInt(trimmed, 10);
    if (t != null && Number.isFinite(t) && t >= 1 && t <= 100) {
      const o = simpleTestVsTarget(last.result, t);
      line += ` — vs ${t} — ${o.success ? 'success' : 'failure'}`;
    }
    appendCombatLogOneLine(historyKey, line);
  }, [historyKey, last, contextTag, targetStr]);

  return (
    <div
      className={`grim-card print:hidden border-iron-700/50 ${compact ? 'p-3' : 'p-4'}`}
    >
      <h2
        className={`font-display text-gold-400/95 uppercase tracking-wider flex items-center gap-2 ${compact ? 'text-xs mb-1.5' : 'text-sm mb-2'}`}
      >
        <DiceIcon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        d100 test (simple)
      </h2>
      {!compact && (
        <p className="text-parchment/55 text-xs mb-3">
          Quick roll: success if your roll is at or under the final target after modifiers. Your rulebook
          governs exact Success Levels, criticals, and 100s.
        </p>
      )}
      <div
        className={`flex flex-wrap gap-1 items-center mb-2 ${compact ? 'gap-0.5' : ''}`}
        role="group"
        aria-label="Optional roll context tag"
      >
        <span className={`text-parchment/45 ${compact ? 'text-[0.55rem] w-full' : 'text-[0.6rem]'}`}>
          Tag
        </span>
        <button
          type="button"
          onClick={() => setContextTag(null)}
          className={`rounded border px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide ${
            contextTag === null
              ? 'border-gold-600/50 text-gold-300/90 bg-ink-800/80'
              : 'border-iron-700/60 text-parchment/45 hover:border-parchment/25'
          }`}
        >
          Off
        </button>
        {ROLL_CONTEXT_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setContextTag(tag)}
            className={`rounded border px-1.5 py-0.5 text-[0.6rem] ${
              contextTag === tag
                ? 'border-gold-600/50 text-gold-300/90 bg-ink-800/80'
                : 'border-iron-700/60 text-parchment/55 hover:border-parchment/25'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-[0.6rem] uppercase text-parchment/45" htmlFor={tid}>
            Target (optional)
          </label>
          <input
            id={tid}
            type="number"
            min={1}
            max={100}
            className="grim-input w-24 !py-1.5 font-mono tabular-nums"
            value={targetStr}
            onChange={(e) => setTargetStr(e.target.value)}
            placeholder="e.g. 45"
          />
        </div>
        <button
          type="button"
          onClick={roll}
          className={`grim-btn-primary text-sm ${compact ? '!py-1 !px-2.5' : '!py-1.5 !px-3'}`}
        >
          Roll
        </button>
        {historyKey && last && (
          <button
            type="button"
            onClick={appendRollToSceneLog}
            className={`grim-btn-ghost text-sm ${compact ? '!py-1 !px-2' : '!py-1.5 !px-2.5'}`}
            title="Append this roll (timestamped) to Combat & scene log below"
          >
            To log
          </button>
        )}
        {last && (
          <div className="min-w-0 flex-1 basis-full sm:basis-auto">
            {contextTag && (
              <p
                className={`text-parchment/50 uppercase tracking-wider ${compact ? 'text-[0.55rem]' : 'text-[0.65rem]'}`}
              >
                {contextTag}
              </p>
            )}
            <p
              className={`font-mono text-gold-300 tabular-nums ${compact ? 'text-xl' : 'text-2xl'}`}
              aria-live="polite"
            >
              {String(last.result)}
            </p>
            <p className={`text-parchment/75 ${compact ? 'text-[0.7rem] leading-snug' : 'text-xs'} mt-0.5`}>
              {last.details}
            </p>
          </div>
        )}
      </div>
      {historyKey && rollHistory.length > 0 && (
        <p className="text-parchment/50 text-[0.65rem] mt-2 font-mono flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <span>
            Last d100: {rollHistory.map((e) => formatD100HistoryEntry(e)).join(' · ')}
          </span>
          <button
            type="button"
            onClick={() => {
              clearD100History(historyKey);
              setRollHistory([]);
            }}
            className="text-parchment/40 hover:text-blood-400/90 underline underline-offset-2"
          >
            Clear history
          </button>
        </p>
      )}
    </div>
  );
}
