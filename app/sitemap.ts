import type { MetadataRoute } from 'next';
import { listStatblocks } from '@/lib/statblockRedis';

export const revalidate = 3600;

function siteBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseUrl();
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/new`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Best-effort: if Redis isn't configured (e.g. at build time without env),
  // skip statblock URLs instead of failing the whole sitemap.
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const blocks = await listStatblocks();
      for (const b of blocks) {
        entries.push({
          url: `${base}/statblock/${encodeURIComponent(String(b.id))}`,
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      }
    } catch {
      // ignore; Upstash unreachable at build time
    }
  }

  return entries;
}
