import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Sessions are stored in localStorage, so this is a no-op
  // The client handles session storage directly
  return NextResponse.json({ 
    success: true,
    message: 'Session stored in localStorage' 
  });
}

export async function GET() {
  // Sessions are stored in localStorage, return empty array
  // The client reads from localStorage directly
  return NextResponse.json([]);
}

