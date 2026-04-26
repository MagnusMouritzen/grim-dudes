'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadSessionNotes, saveSessionNotes } from '@/lib/viewSessionNotes';
import { ScrollIcon } from './icons';

type Props = {
  viewKey: string;
};

export default function ViewSessionNotes({ viewKey }: Props) {
  const [text, setText] = useState('');
  const [ready, setReady] = useState(false);
  const [copyHint, setCopyHint] = useState(false);

  useEffect(() => {
    setText(loadSessionNotes(viewKey));
    setReady(true);
  }, [viewKey]);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value;
      setText(v);
      saveSessionNotes(viewKey, v);
    },
    [viewKey]
  );

  const copyNotes = useCallback(() => {
    if (!text.trim()) return;
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopyHint(true);
        window.setTimeout(() => setCopyHint(false), 2000);
      },
      () => {}
    );
  }, [text]);

  const clearNotes = useCallback(() => {
    if (!text.trim() || !window.confirm('Clear all session notes?')) return;
    setText('');
    saveSessionNotes(viewKey, '');
  }, [text, viewKey]);

  if (!ready) {
    return (
      <div
        className="grim-card p-4 print:hidden min-h-[5rem] border-iron-700/50"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p className="text-parchment/50 text-xs">Notes…</p>
      </div>
    );
  }

  return (
    <section
      className="grim-card p-4 print:hidden border-iron-700/50 bg-ink-900/20"
      aria-labelledby="view-session-notes-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h2
          id="view-session-notes-heading"
          className="font-display text-gold-400/95 text-sm uppercase tracking-wider flex items-center gap-2"
        >
          <ScrollIcon className="w-4 h-4" aria-hidden="true" />
          Session notes
        </h2>
        <div
          className="flex items-center gap-2"
          role="toolbar"
          aria-label="Session notes: copy and clear"
        >
          {copyHint && (
            <span className="text-[0.65rem] uppercase text-gold-400" role="status">
              Copied
            </span>
          )}
          <button
            type="button"
            onClick={copyNotes}
            disabled={!text.trim()}
            className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem]"
            title="Copy all notes to the clipboard"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={clearNotes}
            disabled={!text.trim()}
            className="grim-btn-ghost !py-1 !px-2 !text-[0.65rem] text-parchment/60"
          >
            Clear
          </button>
        </div>
      </div>
      <p className="text-parchment/50 text-xs mb-2">Positions, mood, next beats — this tab only.</p>
      <label htmlFor="session-notes-area" className="sr-only">
        Session notes
      </label>
      <textarea
        id="session-notes-area"
        className="grim-input w-full min-h-[5rem] text-sm text-parchment/90 resize-y"
        value={text}
        onChange={onChange}
        placeholder="Rounds, reminders, read-aloud…"
        spellCheck
      />
    </section>
  );
}
