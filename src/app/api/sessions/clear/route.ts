import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    // Delete all attempts first (due to foreign key constraint)
    await prisma.attempt.deleteMany({});
    
    // Delete all sessions
    await prisma.session.deleteMany({});
    
    return NextResponse.json({ 
      success: true, 
      message: 'All sessions and attempts deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error clearing sessions:', error);
    return NextResponse.json(
      { error: 'Failed to clear sessions', details: error.message },
      { status: 500 }
    );
  }
}



