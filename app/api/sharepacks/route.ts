import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSharePack } from '@/lib/sharePacks';
import { limitWrite } from '@/lib/rateLimit';
import { logError, requestId } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const bodySchema = z.object({
  ids: z.array(z.string().min(1).max(200)).min(1).max(200),
});

const MAX_BODY = 32 * 1024;

export async function POST(req: Request) {
  const limit = await limitWrite(req);
  if (!limit.ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
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
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const id = await createSharePack(parsed.data.ids);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    logError('api.sharepacks.create.failed', e, { rid: requestId(req) });
    return NextResponse.json({ error: 'Failed to create share pack' }, { status: 503 });
  }
}
