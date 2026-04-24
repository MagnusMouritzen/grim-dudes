import { NextResponse } from 'next/server';
import { getCareers } from '@/lib/referenceData';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  try {
    return NextResponse.json(getCareers());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load careers' }, { status: 500 });
  }
}
