import { NextResponse } from 'next/server';
import { listStatblocks, saveStatblock } from '@/lib/statblockRedis';
import { slugifyStatblockId } from '@/lib/statblockKeys';
import { validateStatblockPayload } from '@/lib/validateStatblock';
import type { StatblockRecord } from '@/lib/statblockRedis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_BODY = 256 * 1024;

export async function GET() {
  try {
    const blocks = await listStatblocks();
    return NextResponse.json(blocks);
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Failed to list stat blocks';
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function POST(req: Request) {
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
    return NextResponse.json(payload, { status: 201 });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Failed to save stat block';
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
