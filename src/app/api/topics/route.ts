import { NextResponse } from 'next/server';
import { loadTopicsFromJson } from '@/lib/jsonUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const topics = await loadTopicsFromJson();
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error loading topics:', error);
    return NextResponse.json(
      { error: 'Failed to load topics' },
      { status: 500 }
    );
  }
}

