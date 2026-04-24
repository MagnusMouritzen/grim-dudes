import { NextResponse } from 'next/server';
import { readSharePack } from '@/lib/sharePacks';
import { logError, requestId } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  if (!safeId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const ids = await readSharePack(safeId);
    if (!ids) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ id: safeId, ids });
  } catch (e) {
    logError('api.sharepacks.get.failed', e, { rid: requestId(req), id: safeId });
    return NextResponse.json({ error: 'Failed to load share pack' }, { status: 503 });
  }
}
