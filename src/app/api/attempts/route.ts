import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Attempts are stored in localStorage, so this is a no-op
  // The client handles attempt storage directly
  return NextResponse.json({ 
    success: true,
    message: 'Attempt stored in localStorage' 
  });
}

