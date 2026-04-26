import { NextResponse } from 'next/server';
import {
  listStatblocks,
  listStatblocksPage,
  saveStatblock,
} from '@/lib/statblockRedis';
import { slugifyStatblockId } from '@/lib/statblockKeys';
import { validateStatblockPayload } from '@/lib/validateStatblock';
import { requireWriteAuth } from '@/lib/writeAuth';
import { limitWrite } from '@/lib/rateLimit';
import { logDebug, logError, logInfo, requestId } from '@/lib/logger';
import type { StatblockRecord } from '@/lib/statblockRedis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_BODY = 256 * 1024;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const cursorParam = url.searchParams.get('cursor');
    const limitParam = url.searchParams.get('limit');
    const all = url.searchParams.get('all');

    if (cursorParam != null || limitParam != null) {
      const cursor = cursorParam ?? '0';
      const limit = Math.min(Math.max(Number(limitParam ?? '100'), 1), 500);
      const page = await listStatblocksPage(cursor, limit);
      const rid = requestId(req);
      logInfo('api.statblocks.list.page', {
        rid,
        correlation: rid,
        count: page.blocks.length,
        hasNext: page.nextCursor !== '0',
      });
      return NextResponse.json({
        items: page.blocks,
        nextCursor: page.nextCursor,
      });
    }

    const blocks = await listStatblocks();
    const rid = requestId(req);
    logDebug('api.statblocks.list.full', {
      rid,
      correlation: rid,
      count: blocks.length,
    });
    if (all === '1') {
      // Explicit opt-in; same response as the default for backwards compat.
      return NextResponse.json(blocks);
    }
    return NextResponse.json(blocks);
  } catch (e) {
    logError('api.statblocks.list.failed', e, { rid: requestId(req) });
    return NextResponse.json({ error: 'Failed to list stat blocks' }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const authError = await requireWriteAuth(req);
  if (authError) return authError;
  const limit = await limitWrite(req);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'retry-after': String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))),
        },
      }
    );
  }

  try {
    const text = await req.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const validated = validateStatblockPayload(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const data = validated.data;
    const baseId = data.id || data.name || 'statblock';
    const id = slugifyStatblockId(String(baseId));
    const payload = { ...data, id } as StatblockRecord;
    await saveStatblock(payload);
    const rid = requestId(req);
    logInfo('api.statblocks.create', {
      rid,
      correlation: rid,
      statblockId: id,
    });
    return NextResponse.json(payload, { status: 201 });
  } catch (e) {
    logError('api.statblocks.save.failed', e, { rid: requestId(req) });
    return NextResponse.json({ error: 'Failed to save stat block' }, { status: 503 });
  }
}
