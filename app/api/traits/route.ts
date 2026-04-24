import { NextResponse } from 'next/server';
import { getTraits } from '@/lib/referenceData';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  try {
    return NextResponse.json(getTraits());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load traits' }, { status: 500 });
  }
}
