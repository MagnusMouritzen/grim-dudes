'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ChevronIcon, SwordsIcon } from '@/components/icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grim-page max-w-xl mx-auto text-center py-12 sm:py-16">
      <div className="grim-card p-10 flex flex-col items-center gap-5 border-blood-700/60 ring-1 ring-stone-800/40 motion-safe:animate-fade-in">
        <div className="rounded-full border border-blood-700/50 bg-blood-900/40 p-5">
          <SwordsIcon className="w-14 h-14 text-blood-400" />
        </div>
        <div>
          <p className="grim-label mb-1 text-blood-400/90">Something is grimly amiss</p>
          <h1 className="font-display text-display-md text-blood-300 tracking-wide">
            A cursed error
          </h1>
          <p className="text-parchment-200/90 mt-3 max-w-sm mx-auto text-sm">
            {error.message || 'An unexpected error occurred.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button type="button" onClick={reset} className="grim-btn-primary">
            Try again
          </button>
          <Link href="/" className="grim-btn-ghost">
            <ChevronIcon className="w-3.5 h-3.5 rotate-180" />
            Back to bestiary
          </Link>
        </div>
      </div>
    </div>
  );
}
