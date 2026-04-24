import { NextResponse } from 'next/server';
import { listTemplates } from '@/lib/referenceData';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  try {
    return NextResponse.json(listTemplates());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}
