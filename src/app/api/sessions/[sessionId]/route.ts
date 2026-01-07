import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  // Sessions are stored in localStorage, return empty object
  // The client reads from localStorage directly
  return NextResponse.json({});
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  // Sessions are stored in localStorage, so this is a no-op
  // The client handles session updates directly
  return NextResponse.json({ 
    success: true,
    message: 'Session updated in localStorage' 
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  // Sessions are stored in localStorage, so this is a no-op
  // The client handles session deletion directly
  return NextResponse.json({ 
    success: true,
    message: 'Session deleted from localStorage' 
  });
}

