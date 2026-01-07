import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// This endpoint will be called automatically to initialize the database
export async function GET() {
  try {
    const topicCount = await prisma.topic.count();
    
    if (topicCount === 0) {
      // Trigger initialization by calling the init-db endpoint internally
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      try {
        const initResponse = await fetch(`${baseUrl}/api/init-db`, {
          method: 'POST',
        });
        const result = await initResponse.json();
        return NextResponse.json({ 
          message: 'Database initialization triggered',
          result 
        });
      } catch (error: any) {
        return NextResponse.json({
          message: 'Please visit /api/init-db to initialize the database',
          error: error.message,
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      initialized: true,
      topicCount,
      message: 'Database already initialized',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check database', details: error.message },
      { status: 500 }
    );
  }
}

