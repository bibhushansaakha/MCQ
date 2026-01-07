import { NextResponse } from 'next/server';
import { getTopicStats } from '@/lib/jsonUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getTopicStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error loading topic stats:', error);
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    );
  }
}



