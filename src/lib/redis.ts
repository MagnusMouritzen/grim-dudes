import { Redis } from '@upstash/redis';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error(
      'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN. Copy .env.example to .env.local and add Upstash credentials.'
    );
  }
  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      // We intentionally disable auto-deserialization so JSON strings round-trip
      // predictably. The getJSON/setJSON helpers below give a single parse path.
      automaticDeserialization: false,
    });
  }
  return client;
}

/**
 * SET a JSON-serialisable value as a string. Single place that does
 * `JSON.stringify` so other code never has to.
 */
export async function setJSON<T>(
  key: string,
  value: T,
  options?: { ex?: number }
): Promise<void> {
  const redis = getRedis();
  const json = JSON.stringify(value);
  if (options?.ex) {
    await redis.set(key, json, { ex: options.ex });
  } else {
    await redis.set(key, json);
  }
}

/**
 * GET a previously-stored JSON value. Returns null if the key is absent or the
 * value is unparsable. Single place that does `JSON.parse`.
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  const raw = await redis.get<string>(key);
  if (raw == null || raw === '') return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * MGET then parse. null entries are propagated so callers can still align with
 * the original key order.
 */
export async function mgetJSON<T>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];
  const redis = getRedis();
  const values = (await redis.mget(...keys)) as (string | null)[];
  return values.map((raw) => {
    if (raw == null || raw === '') return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  });
}
