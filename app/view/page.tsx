import { Suspense } from 'react';
import StatBlockMultiView from '@/components/StatBlockMultiView';

function ViewLoading() {
  return (
    <div className="grim-page">
      <div className="grim-card p-8 sm:p-10 text-center border-iron-700/50">
        <p className="text-parchment/60 text-sm font-mono uppercase tracking-wider">Loading encounter…</p>
        <div className="mt-4 h-2 max-w-xs mx-auto rounded-full bg-ink-900/80 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gold-700/40 animate-pulse" />
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
