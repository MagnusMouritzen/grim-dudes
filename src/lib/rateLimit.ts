import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from './redis';

/**
 * Rate limit per-IP for write endpoints. Disabled when Upstash env is missing
 * (no Redis available). 30 writes / minute / IP by default.
 */
let writeLimiter: Ratelimit | null = null;

function getWriteLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!writeLimiter) {
    writeLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(
        Number(process.env.RATE_LIMIT_WRITES_PER_MIN || '30'),
        '60 s'
      ),
      prefix: `${process.env.REDIS_KEY_PREFIX || ''}ratelimit:write`,
      analytics: false,
    });
  }
  return writeLimiter;
}

export type LimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export async function limitWrite(req: Request): Promise<LimitResult> {
  const limiter = getWriteLimiter();
  if (!limiter) {
    return { ok: true, limit: 0, remaining: 0, reset: 0 };
  }
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anon';
  const res = await limiter.limit(ip);
  return { ok: res.success, limit: res.limit, remaining: res.remaining, reset: res.reset };
}
