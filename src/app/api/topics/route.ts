import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Topic } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { topicId: 'asc' },
    });

    const formattedTopics: Topic[] = topics.map(topic => ({
      id: topic.topicId,
      name: topic.name,
      file: '', // Not needed anymore
      description: topic.description,
      isGeneral: topic.isGeneral,
    }));

    // Sort chapters numerically (chapter-01, chapter-02, ..., chapter-10)
    const sorted = formattedTopics.sort((a, b) => {
      const aMatch = a.id.match(/chapter-(\d+)/);
      const bMatch = b.id.match(/chapter-(\d+)/);
      
      // If both are chapters, sort by number
      if (aMatch && bMatch) {
        return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
      }
      
      // Non-chapters come after chapters
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      
      // Both non-chapters, sort alphabetically
      return a.id.localeCompare(b.id);
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error loading topics:', error);
    return NextResponse.json(
      { error: 'Failed to load topics' },
      { status: 500 }
    );
  }
}

