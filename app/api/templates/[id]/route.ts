import { NextResponse } from 'next/server';
import { getTemplateById, listTemplates } from '@/lib/referenceData';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 3600;

export function generateStaticParams() {
  return listTemplates()
    .map((t) => (typeof t.id === 'string' ? { id: t.id } : null))
    .filter((x): x is { id: string } => x !== null);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tpl = getTemplateById(decodeURIComponent(id));
  if (!tpl) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(tpl);
}
