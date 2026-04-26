import { Suspense } from 'react';
import StatBlockList, { BestiaryListSkeleton } from '@/components/StatBlockList';
import { listStatblocks } from '@/lib/statblockRedis';
import { getTraits } from '@/lib/referenceData';
import type { Statblock, TraitRef } from '@/lib/types';

export const revalidate = 60;

async function safeListStatblocks(): Promise<Statblock[] | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  try {
    const blocks = await listStatblocks();
    return blocks as unknown as Statblock[];
  } catch (e) {
    console.error('[/ server] listStatblocks failed', e);
    return null;
  }
}

export default async function HomePage() {
  const blocks = await safeListStatblocks();
  const traits = getTraits() as unknown as TraitRef[];

  if (blocks == null) {
    // Redis unavailable: let the client island render its own error state.
    return (
      <Suspense fallback={<BestiaryListSkeleton />}>
        <StatBlockList />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<BestiaryListSkeleton />}>
      <StatBlockList initialBlocks={blocks} initialTraits={traits} />
    </Suspense>
  );
}
