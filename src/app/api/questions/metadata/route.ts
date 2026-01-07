import { NextResponse } from 'next/server';
import { extractMetadata } from '@/lib/jsonUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metadata = await extractMetadata();
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error loading metadata:', error);
    return NextResponse.json(
      { error: 'Failed to load metadata' },
      { status: 500 }
    );
  }
}

