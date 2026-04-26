'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Statblock } from '@/lib/types';
import {
  loadInitiativeActiveKey,
  saveInitiativeActiveKey,
} from '@/lib/viewInitiativeActive';
import {
  alignInitiativeToBlockOrder,
  loadInitiativeSession,
  saveInitiativeSession,
  newRow,
  sortInitiativeRows,
  type InitiativeRow,
} from '@/lib/viewInitiativeSession';
import { buildInitiativeMarkdown } from '@/lib/buildInitiativeMarkdown';
import { buildInitiativePlainText } from '@/lib/buildInitiativePlainText';
import { loadEncounterLabel, saveEncounterLabel } from '@/lib/viewEncounterLabel';
import { bumpRound, loadRound } from '@/lib/viewRoundSession';
import { loadSceneTime, sceneTimeDisplayLabel } from '@/lib/viewSceneTimeSession';
import ViewAdvantageCounter from './ViewAdvantageCounter';
import ViewCorruptionCounter from './ViewCorruptionCounter';
import ViewSceneTimeChips from './ViewSceneTimeChips';
import ViewFortuneCounter from './ViewFortuneCounter';
import ViewRoundCounter from './ViewRoundCounter';
import ViewSessionXpCounter from './ViewSessionXpCounter';
import ViewTensionTrack from './ViewTensionTrack';
import { CloseIcon, LinkIcon, PlusIcon, ScrollIcon, SwordsIcon } from './icons';

type Props = {
  viewKey: string;
  blocks: Statblock[];
};

export default function ViewInitiativeList({ viewKey, blocks }: Props) {
  const [rows, setRows] = useState<InitiativeRow[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<'text' | 'md' | 'turn' | null>(null);
  const [encounterLabel, setEncounterLabel] = useState('');

  useEffect(() => {
    setRows(sortInitiativeRows(loadInitiativeSession(viewKey)));
    setActiveKey(loadInitiativeActiveKey(viewKey));
    setEncounterLabel(loadEncounterLabel(viewKey));
    setHydrated(true);
  }, [viewKey]);

  useEffect(() => {
    if (activeKey == null) return;
    if (!rows.some((r) => r.key === activeKey)) {
      setActiveKey(null);
      saveInitiativeActiveKey(viewKey, null);
    }
  }, [rows, activeKey, viewKey]);

  const setTurn = useCallback(
    (key: string | null) => {
      setActiveKey(key);
      saveInitiativeActiveKey(viewKey, key);
    },
    [viewKey]
  );

  const persist = useCallback(
    (next: InitiativeRow[]) => {
      const sorted = sortInitiativeRows(next);
      setRows(sorted);
      saveInitiativeSession(viewKey, sorted);
      if (sorted.length === 0) {
        setActiveKey(null);
        saveInitiativeActiveKey(viewKey, null);
      }
    },
    [viewKey]
  );

  const goNextTurn = useCallback(() => {
    if (rows.length === 0) return;
    const sorted = sortInitiativeRows(rows);
    const i = activeKey ? sorted.findIndex((x) => x.key === activeKey) : -1;
    const nextI = i < 0 ? 0 : (i + 1) % sorted.length;
    setTurn(sorted[nextI]!.key);
  }, [rows, activeKey, setTurn]);

  const goPrevTurn = useCallback(() => {
    if (rows.length === 0) return;
    const sorted = sortInitiativeRows(rows);
    const i = activeKey ? sorted.findIndex((x) => x.key === activeKey) : 0;
    const nextI = i <= 0 ? sorted.length - 1 : i - 1;
    setTurn(sorted[nextI]!.key);
  }, [rows, activeKey, setTurn]);

  const startNewRound = useCallback(() => {
    bumpRound(viewKey);
    const sorted = sortInitiativeRows(rows);
    if (sorted.length > 0) {
      setTurn(sorted[0]!.key);
    } else {
      setTurn(null);
    }
  }, [viewKey, rows, setTurn]);

  const copyListAsText = useCallback(() => {
    if (rows.length === 0) return;
    const text = buildInitiativePlainText(viewKey, rows, activeKey);
    if (!text) return;
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopyHint('text');
        setTimeout(() => setCopyHint(null), 2000);
      },
      () => {}
    );
  }, [rows, activeKey, viewKey]);

  const copyTurnOnly = useCallback(() => {
    if (rows.length === 0 || activeKey == null) return;
    const round = loadRound(viewKey);
    const sorted = sortInitiativeRows(rows);
    const cur = sorted.find((r) => r.key === activeKey);
    if (!cur) return;
    const name = cur.name?.trim() || '(unnamed)';
    const st = cur.state?.trim();
    const label = loadEncounterLabel(viewKey).trim();
    const timeId = loadSceneTime(viewKey);
    const timeS = timeId !== '' ? sceneTimeDisplayLabel(timeId) : '';
    const lead: string[] = [];
    if (label) lead.push(label);
    if (timeS) lead.push(timeS);
    const head = lead.length ? `${lead.join(' · ')} · ` : '';
    const line = `${head}Round ${round}: ${name}${st ? ` — ${st}` : ''} ← turn`;
    void navigator.clipboard.writeText(line).then(
      () => {
        setCopyHint('turn');
        setTimeout(() => setCopyHint(null), 2000);
      },
      () => {}
    );
  }, [rows, activeKey, viewKey]);

  const copyListAsMarkdown = useCallback(() => {
    if (rows.length === 0) return;
    const body = buildInitiativeMarkdown(viewKey, rows, activeKey);
    if (!body) return;
    void navigator.clipboard.writeText(body).then(
      () => {
        setCopyHint('md');
        setTimeout(() => setCopyHint(null), 2000);
      },
      () => {}
    );
  }, [rows, activeKey, viewKey]);

  const importFromBlocks = useCallback(() => {
    const existing = new Set(rows.map((r) => r.blockId).filter(Boolean));
    const add: InitiativeRow[] = [];
    blocks.forEach((b) => {
      const id = String(b.id ?? '');
      if (!id || existing.has(id)) return;
      add.push(
        newRow({ name: b.name || id, initiative: 0, blockId: id })
      );
    });
    if (add.length) persist([...rows, ...add]);
  }, [blocks, rows, persist]);

  const hasBlockRow = rows.some(
    (r) => r.blockId && blocks.some((b) => String(b.id ?? '') === r.blockId)
  );

  const alignToPageOrder = useCallback(() => {
    if (blocks.length === 0) return;
    const next = sortInitiativeRows(alignInitiativeToBlockOrder(rows, blocks));
    persist(next);
  }, [blocks, rows, persist]);

  if (!hydrated) {
    return (
      <div className="grim-card p-4 print:hidden min-h-[4rem] border-iron-700/50 bg-ink-900/30">
        <p className="text-parchment/50 text-xs">Initiative…</p>
      </div>
    );
  }

  return (
    <div className="grim-card p-4 print:hidden border-gold-800/30 bg-ink-900/40">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <h2 className="font-display text-gold-400/95 text-sm uppercase tracking-wider flex items-center gap-2">
            <SwordsIcon className="w-4 h-4" />
            Initiative (this page)
          </h2>
          <ViewRoundCounter viewKey={viewKey} />
          <ViewFortuneCounter viewKey={viewKey} />
          <ViewSessionXpCounter viewKey={viewKey} />
          <ViewTensionTrack viewKey={viewKey} />
          <ViewCorruptionCounter viewKey={viewKey} />
          <ViewAdvantageCounter viewKey={viewKey} />
          <ViewSceneTimeChips viewKey={viewKey} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => persist([...rows, newRow({})])}
            className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
          >
            <PlusIcon className="w-3 h-3" />
            Row
          </button>
          {blocks.length > 0 && (
            <button
              type="button"
              onClick={importFromBlocks}
              className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
            >
              Import cast
            </button>
          )}
          {hasBlockRow && (
            <button
              type="button"
              onClick={alignToPageOrder}
              className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
              title="Set initiative values so the sorted list matches stat block order (top to bottom on this page). Then edit to real results."
            >
              Align to cards
            </button>
          )}
          {rows.length > 0 && (
            <>
              <button
                type="button"
                onClick={goPrevTurn}
                className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
                title="Previous in initiative order (sorted list)"
                aria-label="Previous turn"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={goNextTurn}
                className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
                title="Next in initiative order (sorted list)"
                aria-label="Next turn"
              >
                Next →
              </button>
            </>
          )}
          <button
            type="button"
            onClick={startNewRound}
            className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem] border-gold-700/30"
            title="Add 1 to Round (this tab) and, if the list has entries, set turn to the first in order (highest Init)"
            aria-label="Start new round"
          >
            New round
          </button>
          <button
            type="button"
            onClick={copyListAsText}
            disabled={rows.length === 0}
            className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem] inline-flex items-center gap-1"
            title="Plain text: optional encounter name, round, turn, scratch counters if non-zero"
          >
            <LinkIcon className="w-3 h-3" />
            {copyHint === 'text' ? 'Copied' : 'Copy list'}
          </button>
          <button
            type="button"
            onClick={copyListAsMarkdown}
            disabled={rows.length === 0}
            className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem] inline-flex items-center gap-1"
            title="Markdown: round, links, **← turn**, and optional table scratch footer"
          >
            <ScrollIcon className="w-3 h-3" />
            {copyHint === 'md' ? 'Copied' : 'Copy MD'}
          </button>
          <button
            type="button"
            onClick={copyTurnOnly}
            disabled={rows.length === 0 || activeKey == null}
            className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
            title="One line: optional encounter name, round, and who has the turn (voice / VTT status)"
            aria-label="Copy current turn"
          >
            {copyHint === 'turn' ? 'Copied' : 'Copy turn'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (rows.length && !window.confirm('Clear initiative for this view?')) return;
              setTurn(null);
              persist([]);
            }}
            className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem] text-parchment/60"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="mb-3 max-w-xl">
        <label className="text-[0.6rem] uppercase text-parchment/45" htmlFor="encounter-label">
          Encounter name (optional)
        </label>
        <input
          id="encounter-label"
          type="text"
          className="grim-input w-full !py-1.5 text-sm mt-0.5"
          value={encounterLabel}
          onChange={(e) => {
            const v = e.target.value;
            setEncounterLabel(v);
            saveEncounterLabel(viewKey, v);
          }}
          placeholder="e.g. Ratmen cellar"
          maxLength={120}
          autoComplete="off"
        />
      </div>
      {rows.length === 0 ? (
        <p className="text-parchment/55 text-sm">
          Add rows for PCs and monsters, or import names from the stat blocks above. Use{' '}
          <span className="text-parchment/70">Align to cards</span> after import to match the page order,
          then edit Init to real values. Use <span className="text-parchment/70">Turn</span> and{' '}
          <span className="text-parchment/70">Next / Prev</span> to track the acting creature, or{' '}
          <span className="text-parchment/70">New round</span> after a full pass. Use{' '}
          <span className="text-parchment/70">State</span> for quick condition reminders (prone, etc.). Session only.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.key}
              className={`flex flex-wrap items-end gap-2 border-b border-iron-800/50 pb-2 last:border-0 last:pb-0 rounded-sm pl-1 -ml-1 transition-colors ${
                r.key === activeKey
                  ? 'border-l-2 border-l-gold-500/90 bg-ink-900/50'
                  : 'border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex-1 min-w-[8rem]">
                <label className="text-[0.6rem] uppercase text-parchment/45" htmlFor={`init-name-${r.key}`}>
                  Name
                </label>
                <input
                  id={`init-name-${r.key}`}
                  className="grim-input !py-1 !text-sm"
                  value={r.name}
                  onChange={(e) => {
                    persist(rows.map((x) => (x.key === r.key ? { ...x, name: e.target.value } : x)));
                  }}
                />
              </div>
              <div className="w-24">
                <label className="text-[0.6rem] uppercase text-parchment/45" htmlFor={`init-val-${r.key}`}>
                  Init
                </label>
                <input
                  id={`init-val-${r.key}`}
                  type="number"
                  className="grim-input !py-1 !text-sm font-mono tabular-nums"
                  value={Number.isFinite(r.initiative) ? r.initiative : 0}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    persist(
                      rows.map((x) =>
                        x.key === r.key ? { ...x, initiative: Number.isFinite(n) ? n : 0 } : x
                      )
                    );
                  }}
                />
              </div>
              <div className="w-28 min-w-0 sm:w-32">
                <label className="text-[0.6rem] uppercase text-parchment/45" htmlFor={`init-state-${r.key}`}>
                  State
                </label>
                <input
                  id={`init-state-${r.key}`}
                  className="grim-input !py-1 !text-sm"
                  value={r.state ?? ''}
                  maxLength={48}
                  placeholder="—"
                  onChange={(e) => {
                    const v = e.target.value;
                    persist(
                      rows.map((x) =>
                        x.key === r.key
                          ? { ...x, state: v.trim() ? v.slice(0, 48) : undefined }
                          : x
                      )
                    );
                  }}
                />
              </div>
              <div className="flex items-center gap-1 pb-0.5">
                <button
                  type="button"
                  onClick={() => setTurn(r.key === activeKey ? null : r.key)}
                  className={`text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                    r.key === activeKey
                      ? 'border-gold-500/80 text-gold-300 bg-ink-800/80'
                      : 'border-iron-700/50 text-parchment/50 hover:border-parchment/30'
                  }`}
                  title={r.key === activeKey ? 'Clear as current turn' : 'Mark current turn'}
                >
                  Turn
                </button>
                {r.blockId && (
                  <Link
                    href={`/statblock/${encodeURIComponent(r.blockId)}`}
                    className="text-[0.65rem] text-gold-500/90 hover:underline"
                  >
                    Block
                  </Link>
                )}
                <button
                  type="button"
                  className="p-1 text-parchment/40 hover:text-blood-400"
                  aria-label="Remove"
                  onClick={() => persist(rows.filter((x) => x.key !== r.key))}
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
