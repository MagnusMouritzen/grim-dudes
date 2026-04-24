import { NextResponse } from 'next/server';
import { deleteStatblock, getStatblockById, listStatblocks } from '@/lib/statblockRedis';
import { slugifyStatblockId } from '@/lib/statblockKeys';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const slug = slugifyStatblockId(decoded);
  try {
    let block = await getStatblockById(slug);
    if (!block) {
      const all = await listStatblocks();
      block = all.find((b) => String(b.id) === decoded || String(b.id) === slug) ?? null;
    }
    if (!block) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(block);
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Failed to load stat block';
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const slug = slugifyStatblockId(decoded);
  try {
    const ok = await deleteStatblock(slug);
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Failed to delete stat block';
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
