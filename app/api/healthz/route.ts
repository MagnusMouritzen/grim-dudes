import { NextResponse } from 'next/server';
import {
  authDisabled,
  isAuthConfigured,
  isProductionEnv,
  writesRequireAuth,
} from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const hasRedis = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
  const base = { ok: true as const, redis: hasRedis };

  if (!isProductionEnv()) {
    return NextResponse.json(
      {
        ...base,
        authConfigured: isAuthConfigured(),
        authDisabled: authDisabled(),
        writesProtected: writesRequireAuth(),
        region: process.env.VERCEL_REGION || null,
        env: process.env.VERCEL_ENV || process.env.NODE_ENV || null,
      },
      { headers: { 'cache-control': 'no-store' } }
    );
  }

  const token = process.env.HEALTHZ_TOKEN?.trim();
  const url = new URL(req.url);
  const wantsVerbose = url.searchParams.get('verbose') === '1';
  const provided = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

  if (wantsVerbose && token && provided === token) {
    return NextResponse.json(
      {
        ...base,
        authConfigured: isAuthConfigured(),
        authDisabled: authDisabled(),
        writesProtected: writesRequireAuth(),
        region: process.env.VERCEL_REGION || null,
        env: process.env.VERCEL_ENV || process.env.NODE_ENV || null,
      },
      { headers: { 'cache-control': 'no-store' } }
    );
  }

  return NextResponse.json(base, { headers: { 'cache-control': 'no-store' } });
}
