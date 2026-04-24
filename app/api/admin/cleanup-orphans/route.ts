import { NextResponse } from 'next/server';
import { cleanupOrphans } from '@/lib/statblockRedis';
import { isProductionEnv } from '@/lib/session';
import { logError, logInfo, requestId } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Invoked by Vercel Cron: when `CRON_SECRET` is set, Vercel sends
 * `Authorization: Bearer <CRON_SECRET>`. In production, `CRON_SECRET` is required
 * and the Bearer token must match. Without a secret, non-production may allow
 * `x-vercel-cron: 1` only (local / preview with cron header).
 */
export async function GET(req: Request) {
  const rid = requestId(req);
  const isCron = req.headers.get('x-vercel-cron') === '1';
  const expected = process.env.CRON_SECRET?.trim();
  const provided = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

  if (expected) {
    if (provided !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (isProductionEnv()) {
    return NextResponse.json(
      { error: 'Set CRON_SECRET in production. Vercel injects it as Authorization: Bearer for cron jobs.' },
      { status: 401 }
    );
  } else if (!isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await cleanupOrphans();
    logInfo('cron.cleanupOrphans', {
      rid,
      kept: res.kept,
      removed: res.removed.length,
      isCron,
    });
    return NextResponse.json({
      ok: true,
      kept: res.kept,
      removed: res.removed,
    });
  } catch (e) {
    logError('cron.cleanupOrphans.failed', e, { rid });
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 503 });
  }
}
