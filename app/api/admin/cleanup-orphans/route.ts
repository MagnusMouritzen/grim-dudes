import { NextResponse } from 'next/server';
import { cleanupOrphans } from '@/lib/statblockRedis';
import { logError, logInfo, requestId } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Invoked by Vercel Cron. Protected in two ways:
 *  1. `x-vercel-cron: 1` is set by Vercel itself for cron invocations.
 *  2. If `CRON_SECRET` is configured, we additionally require an
 *     `authorization: Bearer <CRON_SECRET>` header, letting you trigger the
 *     endpoint manually while still rejecting anonymous traffic.
 */
export async function GET(req: Request) {
  const rid = requestId(req);
  const isCron = req.headers.get('x-vercel-cron') === '1';
  const expected = process.env.CRON_SECRET;
  const provided = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const authedManually = Boolean(expected) && provided === expected;

  if (!isCron && !authedManually) {
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
