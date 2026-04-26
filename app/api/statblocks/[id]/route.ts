import { NextResponse } from 'next/server';
import {
  deleteStatblock,
  getStatblockById,
  saveStatblock,
} from '@/lib/statblockRedis';
import { slugifyStatblockId } from '@/lib/statblockKeys';
import { validateStatblockPayload } from '@/lib/validateStatblock';
import { requireWriteAuth } from '@/lib/writeAuth';
import { limitWrite } from '@/lib/rateLimit';
import { logError, logInfo, requestId } from '@/lib/logger';
import type { StatblockRecord } from '@/lib/statblockRedis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_BODY = 256 * 1024;

function decode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const slug = slugifyStatblockId(decode(raw));
  try {
    const block = await getStatblockById(slug);
    if (!block) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(block);
  } catch (e) {
    logError('api.statblocks.get.failed', e, { rid: requestId(req), slug });
    return NextResponse.json({ error: 'Failed to load stat block' }, { status: 503 });
  }
}

/** PUT alias for updating an existing stat block at its canonical slug. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireWriteAuth(req);
  if (authError) return authError;
  const limit = await limitWrite(req);
  if (!limit.ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { id: raw } = await params;
  const slug = slugifyStatblockId(decode(raw));
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
    const payload = { ...validated.data, id: slug } as StatblockRecord;
    await saveStatblock(payload);
    const rid = requestId(req);
    logInfo('api.statblocks.update', {
      rid,
      correlation: rid,
      statblockId: slug,
    });
    return NextResponse.json(payload, { status: 200 });
  } catch (e) {
    logError('api.statblocks.put.failed', e, { rid: requestId(req), slug });
    return NextResponse.json({ error: 'Failed to save stat block' }, { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireWriteAuth(req);
  if (authError) return authError;
  const limit = await limitWrite(req);
  if (!limit.ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { id: raw } = await params;
  const slug = slugifyStatblockId(decode(raw));
  try {
    const ok = await deleteStatblock(slug);
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const rid = requestId(req);
    logInfo('api.statblocks.delete', {
      rid,
      correlation: rid,
      statblockId: slug,
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    logError('api.statblocks.delete.failed', e, { rid: requestId(req), slug });
    return NextResponse.json({ error: 'Failed to delete stat block' }, { status: 503 });
  }
}
