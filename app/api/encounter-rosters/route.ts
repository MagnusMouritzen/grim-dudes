import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createEncounterRoster, listEncounterRosters } from '@/lib/encounterRosters';
import { requireWriteAuth } from '@/lib/writeAuth';
import { limitWrite } from '@/lib/rateLimit';
import { logError, requestId } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const postSchema = z.object({
  name: z.string().min(1).max(200),
  ids: z.array(z.string().min(1).max(200)).min(1).max(200),
});

const MAX_BODY = 64 * 1024;

export async function GET() {
  try {
    const items = await listEncounterRosters();
    return NextResponse.json(items);
  } catch (e) {
    logError('api.encounterRosters.list.failed', e, { rid: null });
    return NextResponse.json({ error: 'Failed to list rosters' }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const authError = await requireWriteAuth(req);
  if (authError) return authError;
  const limit = await limitWrite(req);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'retry-after': String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))) } }
    );
  }
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    const body: unknown = JSON.parse(text) as unknown;
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { slug } = await createEncounterRoster(parsed.data.name, parsed.data.ids);
    return NextResponse.json({ slug, name: parsed.data.name.trim() }, { status: 201 });
  } catch (e) {
    const err = e instanceof Error ? e.message : '';
    if (err === 'EMPTY') {
      return NextResponse.json({ error: 'No valid stat block ids' }, { status: 400 });
    }
    logError('api.encounterRosters.create.failed', e, { rid: requestId(req) });
    return NextResponse.json({ error: 'Failed to save roster' }, { status: 503 });
  }
}
