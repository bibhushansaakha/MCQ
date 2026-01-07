import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  // Sessions are stored in localStorage, so this is a no-op
  // The client handles clearing directly
  return NextResponse.json({ 
    success: true, 
    message: 'Sessions cleared from localStorage (handled by client)' 
  });
}



