'use client';

import { useCallback, useEffect, useState } from 'react';
import { appendCombatLogLine, loadCombatLog, saveCombatLog, subscribeCombatLog } from '@/lib/viewCombatLog';
import { SkullIcon } from './icons';

type Props = {
  viewKey: string;
};

export default function ViewCombatLog({ viewKey }: Props) {
  const [text, setText] = useState('');
  const [draft, setDraft] = useState('');
  const [ready, setReady] = useState(false);
  const [copyHint, setCopyHint] = useState(false);

  useEffect(() => {
    setText(loadCombatLog(viewKey));
    setReady(true);
    return subscribeCombatLog(viewKey, () => {
      setText(loadCombatLog(viewKey));
    });
  }, [viewKey]);

  const persist = useCallback(
    (v: string) => {
      setText(v);
      saveCombatLog(viewKey, v);
    },
    [viewKey]
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      persist(e.target.value);
    },
    [persist]
  );

  const append = useCallback(() => {
    const line = draft.trim();
    if (!line) return;
    const next = appendCombatLogLine(text, line, new Date());
    persist(next);
    setDraft('');
  }, [draft, text, persist]);

  const copyLog = useCallback(() => {
    if (!text.trim()) return;
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopyHint(true);
        window.setTimeout(() => setCopyHint(false), 2000);
      },
      () => {}
    );
  }, [text]);

  const clearLog = useCallback(() => {
    if (!text.trim() || !window.confirm('Clear the whole combat & scene log?')) return;
    persist('');
  }, [text, persist]);

  if (!ready) {
    return (
      <div className="grim-card p-4 print:hidden min-h-[4rem] border-iron-700/50">
        <p className="text-parchment/50 text-xs">Log…</p>
      </div>
    );
  }

  return (
    <div className="grim-card p-4 print:hidden border-iron-700/50 bg-ink-900/20">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h2 className="font-display text-gold-400/95 text-sm uppercase tracking-wider flex items-center gap-2">
          <SkullIcon className="w-4 h-4" />
          Combat &amp; scene log
        </h2>
        <div className="flex items-center gap-2">
          {copyHint && (
            <span className="text-[0.65rem] uppercase text-gold-400" role="status">
              Copied
            </span>
          )}
          <button
            type="button"
            onClick={copyLog}
            disabled={!text.trim()}
            className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
            title="Copy full log"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={clearLog}
            disabled={!text.trim()}
            className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem] text-parchment/60"
          >
            Clear
          </button>
        </div>
      </div>
      <p className="text-parchment/50 text-xs mb-2">
        Timestamped lines (Append)—crits, conditions, who fell. Editable; this tab only.
      </p>
      <label htmlFor="combat-log-body" className="sr-only">
        Full log
      </label>
      <textarea
        id="combat-log-body"
        className="grim-input w-full min-h-[4.5rem] text-sm text-parchment/90 resize-y mb-2"
        value={text}
        onChange={onChange}
        placeholder="[09:30] Ogre proned…"
        spellCheck
      />
      <div className="flex flex-wrap gap-2 items-end">
        <div className="min-w-0 flex-1">
          <label className="text-[0.6rem] uppercase text-parchment/45" htmlFor="combat-log-append">
            Add line
          </label>
          <input
            id="combat-log-append"
            type="text"
            className="grim-input w-full !py-1.5 text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                append();
              }
            }}
            placeholder="Short beat, then Append or Enter"
            spellCheck
          />
        </div>
        <button type="button" onClick={append} className="grim-btn-primary !py-1.5 !px-3 text-sm shrink-0">
          Append
        </button>
      </div>
    </div>
  );
}
