import { Suspense } from 'react';
import StatBlockMultiView from '@/components/StatBlockMultiView';

function ViewLoading() {
  return (
    <div
      className="grim-page max-w-md mx-auto motion-safe:animate-fade-in"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="grim-card w-full p-8 sm:p-10 text-center border-stone-700/65">
        <p className="text-parchment-200/90 text-sm font-mono uppercase tracking-wider">
          Loading encounter…
        </p>
        <div
          className="mt-4 h-2 max-w-xs mx-auto rounded-full bg-ink-900/80 overflow-hidden ring-1 ring-stone-800/50"
          aria-hidden="true"
        >
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-gold-700/50 via-brazier-500/60 to-gold-600/50 motion-safe:animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ViewPage() {
  return (
    <Suspense fallback={<ViewLoading />}>
      <StatBlockMultiView />
    </Suspense>
  );
}
