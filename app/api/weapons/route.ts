import { NextResponse } from 'next/server';
import { getWeaponsBundle } from '@/lib/referenceData';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(getWeaponsBundle());
}
