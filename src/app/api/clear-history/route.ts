import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // History is stored in localStorage, so this is just a no-op endpoint
  // The client clears localStorage directly
  return NextResponse.json({ 
    success: true,
    message: 'History cleared successfully (localStorage handled by client)' 
  });
}



