'use client';

import { useCallback, useState } from 'react';
import {
  WFRP_ENCOUNTER_TABLES,
  rollWfrpEncounterTable,
  type WfrpEncounterTableId,
} from '@/lib/wfrpEncounterTables';
import { appendCombatLogOneLine } from '@/lib/viewCombatLog';
import { LinkIcon, SwordsIcon } from './icons';

const ORDER: WfrpEncounterTableId[] = ['disposition', 'mishap', 'chase', 'social'];

type Last = {
  id: WfrpEncounterTableId;
  die: number;
  text: string;
  sides: number;
};

type Props = {
  logKey?: string;
};

function formatLogLine(row: Last): string {
  const label = WFRP_ENCOUNTER_TABLES[row.id].label;
  return `Encounter: ${label} (d${row.sides}) ${row.die} — ${row.text}`;
}

export default function ViewEncounterTables({ logKey }: Props) {
  const [byId, setById] = useState<Partial<Record<WfrpEncounterTableId, Last>>>({});
  const [copiedId, setCopiedId] = useState<WfrpEncounterTableId | null>(null);

  const roll = useCallback((id: WfrpEncounterTableId) => {
    const r = rollWfrpEncounterTable(id);
    setById((prev) => ({
      ...prev,
      [id]: { id, die: r.die, text: r.text, sides: WFRP_ENCOUNTER_TABLES[id].rows.length },
    }));
  }, []);

  const copy = useCallback(
    (id: WfrpEncounterTableId) => {
      const last = byId[id];
      if (!last) return;
      const line = formatLogLine(last);
      void navigator.clipboard.writeText(line).then(
        () => {
          setCopiedId(id);
          setTimeout(() => setCopiedId((x) => (x === id ? null : x)), 1500);
        },
        () => {}
      );
    },
    [byId]
  );

  const toLog = useCallback(
    (id: WfrpEncounterTableId) => {
      if (!logKey) return;
      const last = byId[id];
      if (!last) return;
      appendCombatLogOneLine(logKey, formatLogLine(last));
    },
    [logKey, byId]
  );

  return (
    <div className="grim-card p-4 print:hidden border-iron-700/50">
      <h2 className="font-display text-gold-400/95 text-sm uppercase tracking-wider flex items-center gap-2 mb-2">
        <SwordsIcon className="w-4 h-4" />
        Encounter beats
      </h2>
      <p className="text-parchment/55 text-xs mb-3">
        Quick <strong className="text-parchment/80">d6 / d8 / d10</strong> prompts for social reads, stumbles, chases, and
        what is at stake—original text, not your rulebook. Use official tables for tests, fear, fumbles, and crits.
      </p>
      <ul className="space-y-3" aria-label="Encounter prompt tables">
        {ORDER.map((id) => {
          const { label, help, rows } = WFRP_ENCOUNTER_TABLES[id];
          const sides = rows.length;
          const last = byId[id];
          return (
            <li key={id} className="border border-iron-800/60 rounded-md p-2.5 bg-ink-900/20">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-2">
                <div>
                  <span className="text-[0.65rem] uppercase text-parchment/50 font-display tracking-wide">{label}</span>
                  <span className="text-parchment/35 text-xs ml-1">d{sides}</span>
                </div>
                <p className="text-[0.65rem] text-parchment/45 leading-snug sm:text-right sm:max-w-[60%]">{help}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => roll(id)}
                  className="grim-btn-primary !py-1.5 !px-2.5 text-sm"
                >
                  Roll
                </button>
                {last && (
                  <>
                    <span className="text-parchment/90 text-sm font-mono tabular-nums" aria-live="polite">
                      {last.die} → <span className="text-parchment/95">{last.text}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copy(id)}
                      className="grim-btn-ghost !py-1.5 !px-2 text-sm inline-flex items-center gap-1"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      {copiedId === id ? 'Copied' : 'Copy'}
                    </button>
                    {logKey && (
                      <button type="button" onClick={() => toLog(id)} className="grim-btn-ghost !py-1.5 !px-2.5 text-sm">
                        To log
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
