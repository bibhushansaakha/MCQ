import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all unique topicIds from questions
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        topicId: true,
        questionNumber: true,
        question: true,
        chapter: true,
      },
    });

    // Group by topicId
    const topicIdMap = new Map<string, {
      count: number;
      sampleQuestions: Array<{ id: string; questionNumber: number | null; question: string; chapter: string | null }>;
      topicIds: Set<string>;
    }>();

    for (const q of questions) {
      if (!topicIdMap.has(q.topicId)) {
        topicIdMap.set(q.topicId, {
          count: 0,
          sampleQuestions: [],
          topicIds: new Set(),
        });
      }
      const entry = topicIdMap.get(q.topicId)!;
      entry.count++;
      entry.topicIds.add(q.topicId);
      
      // Add sample questions (first 3)
      if (entry.sampleQuestions.length < 3) {
        entry.sampleQuestions.push({
          id: q.id,
          questionNumber: q.questionNumber,
          question: q.question.substring(0, 100) + (q.question.length > 100 ? '...' : ''),
          chapter: q.chapter,
        });
      }
    }

    // Get all topics to check for orphaned questions
    const allTopics = await prisma.topic.findMany({
      select: { topicId: true, name: true },
    });
    const validTopicIds = new Set(allTopics.map(t => t.topicId));

    // Check for orphaned questions
    const orphanedQuestions: string[] = [];
    for (const [topicId] of topicIdMap) {
      if (!validTopicIds.has(topicId)) {
        orphanedQuestions.push(topicId);
      }
    }

    // Format results
    const results: Record<string, any> = {};
    for (const [topicId, data] of topicIdMap) {
      results[topicId] = {
        count: data.count,
        sampleQuestions: data.sampleQuestions,
        hasValidTopic: validTopicIds.has(topicId),
        topicName: allTopics.find(t => t.topicId === topicId)?.name || 'NOT FOUND',
      };
    }

    // Get total counts
    const totalQuestions = questions.length;
    const totalTopics = allTopics.length;
    const questionsWithValidTopics = Array.from(topicIdMap.keys()).filter(id => validTopicIds.has(id)).length;

    return NextResponse.json({
      summary: {
        totalQuestions,
        totalTopics,
        uniqueTopicIds: topicIdMap.size,
        questionsWithValidTopics,
        orphanedTopicIds: orphanedQuestions.length,
      },
      topicIdDetails: results,
      orphanedTopicIds: orphanedQuestions,
      allValidTopicIds: Array.from(validTopicIds),
      diagnostic: {
        message: orphanedQuestions.length > 0 
          ? `Found ${orphanedQuestions.length} orphaned topicId(s): ${orphanedQuestions.join(', ')}`
          : 'All questions have valid topicIds',
        topicIdFormatCheck: Array.from(topicIdMap.keys()).every(id => /^chapter-\d{2}$/.test(id))
          ? 'All topicIds match expected format (chapter-XX)'
          : `Some topicIds don't match expected format. Found: ${Array.from(topicIdMap.keys()).join(', ')}`,
      },
    });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug questions', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

