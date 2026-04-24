import { NextResponse } from 'next/server';
import { getTemplateById } from '@/lib/referenceData';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const tpl = getTemplateById(decodeURIComponent(id));
    if (!tpl) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(tpl);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 });
  }
}
