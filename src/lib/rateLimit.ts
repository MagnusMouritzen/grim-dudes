import { Ratelimit } from '@upstash/ratelimit';
import { getClientIpFromRequest } from './clientIp';
import { getRedis } from './redis';

const WINDOW_MS = 60_000;

/**
 * Rate limit per-IP for write endpoints. Uses Upstash when configured; otherwise
 * an in-process fixed window (per instance). 30 writes / minute / IP by default.
 */
let writeLimiter: Ratelimit | null = null;
let memWriteWarned = false;
const memWriteStore = new Map<string, { winStart: number; count: number }>();

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

function memoryLimit(
  store: Map<string, { winStart: number; count: number }>,
  key: string,
  max: number
): LimitResult {
  const now = Date.now();
  let e = store.get(key);
  if (!e || now - e.winStart >= WINDOW_MS) {
    e = { winStart: now, count: 0 };
  }
  const reset = e.winStart + WINDOW_MS;
  if (e.count < max) {
    e.count += 1;
    store.set(key, e);
    return { ok: true, limit: max, remaining: max - e.count, reset };
  }
  store.set(key, e);
  return { ok: false, limit: max, remaining: 0, reset };
}

/**
 * When Upstash is missing, in-process per-IP limit (per server instance).
 * Does not share state across serverless invocations; still caps abuse per instance.
 */
export async function limitWriteByIp(ip: string): Promise<LimitResult> {
  const max = Math.max(1, Number(process.env.RATE_LIMIT_WRITES_PER_MIN || '30'));
  const limiter = getWriteLimiter();
  if (limiter) {
    const res = await limiter.limit(ip);
    return {
      ok: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  }
  if (!memWriteWarned) {
    memWriteWarned = true;
    console.warn(
      '[rateLimit] Upstash not configured; using in-process write rate limit (per instance).'
    );
  }
  return memoryLimit(memWriteStore, `w:${ip}`, max);
}

export async function limitWrite(req: Request): Promise<LimitResult> {
  return limitWriteByIp(getClientIpFromRequest(req));
}

let loginLimiter: Ratelimit | null = null;
let memLoginWarned = false;
const memLoginStore = new Map<string, { winStart: number; count: number }>();

function getLoginLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!loginLimiter) {
    loginLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(
        Number(process.env.RATE_LIMIT_LOGIN_PER_MIN || '15'),
        '60 s'
      ),
      prefix: `${process.env.REDIS_KEY_PREFIX || ''}ratelimit:login`,
      analytics: false,
    });
  }
  return loginLimiter;
}

export async function limitLoginByIp(ip: string): Promise<LimitResult> {
  const max = Math.max(1, Number(process.env.RATE_LIMIT_LOGIN_PER_MIN || '15'));
  const limiter = getLoginLimiter();
  if (limiter) {
    const res = await limiter.limit(ip);
    return {
      ok: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  }
  if (!memLoginWarned) {
    memLoginWarned = true;
    console.warn(
      '[rateLimit] Upstash not configured; using in-process login rate limit (per instance).'
    );
  }
  return memoryLimit(memLoginStore, `l:${ip}`, max);
}

export async function limitLogin(req: Request): Promise<LimitResult> {
  return limitLoginByIp(getClientIpFromRequest(req));
}
