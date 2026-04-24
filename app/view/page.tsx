import { Suspense } from 'react';
import StatBlockMultiView from '@/components/StatBlockMultiView';

export default function ViewPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-parchment/80">Loading…</div>}>
      <StatBlockMultiView />
    </Suspense>
  );
}
