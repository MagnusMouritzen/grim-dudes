import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteEncounterRoster, getEncounterRoster, updateEncounterRoster } from '@/lib/encounterRosters';
import { slugifyStatblockId } from '@/lib/statblockKeys';
import { requireWriteAuth } from '@/lib/writeAuth';
import { limitWrite } from '@/lib/rateLimit';
import { logError, requestId } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_BODY = 64 * 1024;

const patchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    ids: z.array(z.string().min(1).max(200)).min(1).max(200).optional(),
  })
  .refine((b) => b.name !== undefined || b.ids !== undefined, { message: 'No changes' });

function decodeParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = slugifyStatblockId(decodeParam(raw));
  try {
    const rec = await getEncounterRoster(slug);
    if (!rec) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ name: rec.name, ids: rec.ids, updatedAt: rec.updatedAt });
  } catch (e) {
    logError('api.encounterRosters.get.failed', e, { rid: null, slug });
    return NextResponse.json({ error: 'Failed to load roster' }, { status: 503 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authError = await requireWriteAuth(req);
  if (authError) return authError;
  const limit = await limitWrite(req);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'retry-after': String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))) } }
    );
  }
  const { slug: raw } = await params;
  const slug = slugifyStatblockId(decodeParam(raw));
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    let body: unknown;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const updated = await updateEncounterRoster(slug, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ name: updated.name, ids: updated.ids, updatedAt: updated.updatedAt });
  } catch (e) {
    const err = e instanceof Error ? e.message : '';
    if (err === 'EMPTY') {
      return NextResponse.json({ error: 'No valid stat block ids' }, { status: 400 });
    }
    logError('api.encounterRosters.patch.failed', e, { rid: requestId(req), slug });
    return NextResponse.json({ error: 'Failed to update roster' }, { status: 503 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const authError = await requireWriteAuth(req);
  if (authError) return authError;
  const limit = await limitWrite(req);
  if (!limit.ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  const { slug: raw } = await params;
  const slug = slugifyStatblockId(decodeParam(raw));
  try {
    const ok = await deleteEncounterRoster(slug);
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    logError('api.encounterRosters.delete.failed', e, { rid: requestId(req), slug });
    return NextResponse.json({ error: 'Failed to delete roster' }, { status: 503 });
  }
}
