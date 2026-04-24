import { NextResponse } from 'next/server';
import { getWeaponsBundle } from '@/lib/referenceData';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  try {
    return NextResponse.json(getWeaponsBundle());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load weapons' }, { status: 500 });
  }
}
