import { NextResponse } from 'next/server';
import { listTemplates } from '@/lib/referenceData';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(listTemplates());
}
