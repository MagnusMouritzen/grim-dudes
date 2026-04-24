import { NextResponse } from 'next/server';
import { getArmourBundle } from '@/lib/referenceData';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  try {
    return NextResponse.json(getArmourBundle());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load armour' }, { status: 500 });
  }
}
