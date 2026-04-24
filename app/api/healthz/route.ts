import { NextResponse } from 'next/server';
import { authDisabled, isAuthConfigured, writesRequireAuth } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const hasRedis = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
  return NextResponse.json(
    {
      ok: true,
      redis: hasRedis,
      authConfigured: isAuthConfigured(),
      authDisabled: authDisabled(),
      writesProtected: writesRequireAuth(),
      region: process.env.VERCEL_REGION || null,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || null,
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
