import type { Metadata } from 'next';
import StatBlockView from '@/components/StatBlockView';
import { getStatblockById } from '@/lib/statblockRedis';
import { slugifyStatblockId } from '@/lib/statblockKeys';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const slug = slugifyStatblockId(decodeURIComponent(id));
  let name: string | null = null;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const block = await getStatblockById(slug);
      if (block && typeof block.name === 'string') name = block.name;
    } catch {
      // ignore; fallback metadata below
    }
  }
  const title = name ? `${name} — Grim Dudes` : 'Stat block — Grim Dudes';
  return {
    title,
    description: name ? `${name} stat block for WFRP 4e.` : 'WFRP 4e stat block.',
  };
}

export default function StatBlockPage() {
  return <StatBlockView />;
}
