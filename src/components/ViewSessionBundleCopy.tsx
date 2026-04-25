'use client';

import { useCallback, useState } from 'react';
import { buildViewSessionBundleMarkdown, buildViewSessionBundlePlain } from '@/lib/buildViewSessionBundle';
import { LinkIcon, ScrollIcon } from './icons';

type Props = {
  viewKey: string;
};

/**
 * Stitches initiative (if any), session notes, and combat log into one plain-text copy for pasting
 * to Obsidian, email, or a VTT.
 */
export default function ViewSessionBundleCopy({ viewKey }: Props) {
  const [hint, setHint] = useState<'copied' | 'copiedMd' | 'empty' | null>(null);

  const runCopy = useCallback(
    (text: string, ok: 'copied' | 'copiedMd') => {
      if (!text.trim()) {
        setHint('empty');
        window.setTimeout(() => setHint(null), 2500);
        return;
      }
      void navigator.clipboard.writeText(text).then(
        () => {
          setHint(ok);
          window.setTimeout(() => setHint(null), 2000);
        },
        () => {
          setHint('empty');
          window.setTimeout(() => setHint(null), 2500);
        }
      );
    },
    []
  );

  const copyPlain = useCallback(() => {
    runCopy(buildViewSessionBundlePlain(viewKey), 'copied');
  }, [viewKey, runCopy]);

  const copyMd = useCallback(() => {
    runCopy(buildViewSessionBundleMarkdown(viewKey), 'copiedMd');
  }, [viewKey, runCopy]);

  return (
    <div className="grim-card p-3 print:hidden border-iron-700/50 border-dashed border-iron-600/50 bg-ink-900/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-parchment/60 text-xs min-w-0">
          <ScrollIcon className="w-3.5 h-3.5 inline -mt-0.5 mr-1 opacity-80" />
          One paste: <span className="text-parchment/80">initiative</span> (if you use it),{' '}
          <span className="text-parchment/80">session notes</span>, and{' '}
          <span className="text-parchment/80">combat &amp; scene log</span>.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {hint === 'empty' && (
            <span className="text-[0.65rem] text-blood-400/90" role="status">
              Nothing to copy yet
            </span>
          )}
          {(hint === 'copied' || hint === 'copiedMd') && (
            <span className="text-[0.65rem] uppercase text-gold-400" role="status">
              Copied{hint === 'copiedMd' ? ' (MD)' : ''}
            </span>
          )}
          <button
            type="button"
            onClick={copyPlain}
            className="grim-btn-ghost !py-1.5 !px-2.5 !text-[0.7rem] inline-flex items-center gap-1.5"
            title="Plain text: initiative (if any) + session notes + combat log, separated by ---"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Copy session
          </button>
          <button
            type="button"
            onClick={copyMd}
            className="grim-btn-ghost !py-1.5 !px-2.5 !text-[0.7rem] inline-flex items-center gap-1.5"
            title="Markdown: initiative with links, then notes and log, separated by ---"
          >
            <ScrollIcon className="w-3.5 h-3.5" />
            Copy MD
          </button>
        </div>
      </div>
    </div>
  );
}
