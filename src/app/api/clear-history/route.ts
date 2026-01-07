import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Delete all attempts first (due to foreign key constraint)
    const deletedAttempts = await prisma.attempt.deleteMany({});
    
    // Delete all sessions
    const deletedSessions = await prisma.session.deleteMany({});
    
    return NextResponse.json({ 
      success: true,
      deletedSessions: deletedSessions.count,
      deletedAttempts: deletedAttempts.count,
      message: 'All history cleared successfully' 
    });
  } catch (error: any) {
    console.error('Error clearing history:', error);
    return NextResponse.json(
      { error: 'Failed to clear history', details: error.message },
      { status: 500 }
    );
  }
}



