import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get unique chapters, difficulties, and sources
    const [chapters, difficulties, sources] = await Promise.all([
      prisma.question.findMany({
        select: { chapter: true },
        distinct: ['chapter'],
        where: { chapter: { not: null } },
      }),
      prisma.question.findMany({
        select: { difficulty: true },
        distinct: ['difficulty'],
        where: { difficulty: { not: null } },
      }),
      prisma.question.findMany({
        select: { source: true },
        distinct: ['source'],
        where: { source: { not: null } },
      }),
    ]);

    return NextResponse.json({
      chapters: chapters.map(c => c.chapter).filter(Boolean).sort(),
      difficulties: difficulties.map(d => d.difficulty).filter(Boolean).sort() as ('easy' | 'difficult')[],
      sources: sources.map(s => s.source).filter(Boolean).sort(),
    });
  } catch (error) {
    console.error('Error loading metadata:', error);
    return NextResponse.json(
      { error: 'Failed to load metadata' },
      { status: 500 }
    );
  }
}

