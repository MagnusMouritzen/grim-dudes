import { NextResponse } from 'next/server';
import { listStatblocks, saveStatblock } from '@/lib/statblockRedis';
import { slugifyStatblockId } from '@/lib/statblockKeys';
import { validateStatblockPayload } from '@/lib/validateStatblock';
import { requireWriteAuth } from '@/lib/writeAuth';
import { limitWrite } from '@/lib/rateLimit';
import { logError, logInfo, requestId } from '@/lib/logger';
import type { StatblockRecord } from '@/lib/statblockRedis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_BODY = 8 * 1024 * 1024;
const MAX_ITEMS = 500;

export type ImportMode = 'skip' | 'overwrite';

type ImportBody = {
  items?: unknown;
  mode?: string;
};

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

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    body = JSON.parse(text) as unknown;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let itemList: unknown[];
  let mode: ImportMode = 'skip';
  if (Array.isArray(body)) {
    itemList = body;
  } else if (body && typeof body === 'object' && Array.isArray((body as ImportBody).items)) {
    const o = body as ImportBody;
    itemList = o.items as unknown[];
    mode = o.mode === 'overwrite' ? 'overwrite' : 'skip';
  } else {
    return NextResponse.json(
      { error: 'Expected a JSON array of stat blocks or { items, mode? }' },
      { status: 400 }
    );
  }

  if (itemList.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `At most ${MAX_ITEMS} items per import` },
      { status: 400 }
    );
  }

  const rid = requestId(req);
  let dbIds: Set<string>;
  try {
    const blocks = await listStatblocks();
    dbIds = new Set(blocks.map((b) => String(b.id)));
  } catch (e) {
    logError('api.admin.import.list.failed', e, { rid });
    return NextResponse.json({ error: 'Failed to read existing stat blocks' }, { status: 503 });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < itemList.length; i++) {
    const raw = itemList[i];
    const validated = validateStatblockPayload(raw);
    if (!validated.ok) {
      errors.push({ index: i, error: validated.error });
      continue;
    }
    const baseId = validated.data.id || validated.data.name || 'statblock';
    const id = slugifyStatblockId(String(baseId));
    const payload = { ...validated.data, id } as StatblockRecord;

    if (mode === 'skip' && dbIds.has(id)) {
      skipped += 1;
      continue;
    }
    const existed = dbIds.has(id);
    try {
      await saveStatblock(payload);
      if (existed) {
        updated += 1;
      } else {
        created += 1;
        dbIds.add(id);
      }
    } catch (e) {
      logError('api.admin.import.save.failed', e, { rid, index: i, statblockId: id });
      errors.push({ index: i, error: 'Failed to save' });
    }
  }

  logInfo('api.admin.import.done', {
    rid,
    correlation: rid,
    mode,
    created,
    updated,
    skipped,
    errorCount: errors.length,
  });

  return NextResponse.json({
    mode,
    created,
    updated,
    skipped,
    errors,
  });
}
