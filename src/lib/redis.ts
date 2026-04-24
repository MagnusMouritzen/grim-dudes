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
      automaticDeserialization: false,
    });
  }
  return client;
}
