import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    const stats = topics.reduce((acc, topic) => {
      acc[topic.topicId] = topic._count.questions;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error loading topic stats:', error);
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    );
  }
}



