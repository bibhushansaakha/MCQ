import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Question } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapters, difficulties, sources, topicId } = body;

    // Build where clause dynamically
    const where: any = {};

    if (topicId) {
      where.topicId = topicId;
    }

    if (chapters && chapters.length > 0) {
      where.chapter = { in: chapters };
    }

    if (difficulties && difficulties.length > 0) {
      where.difficulty = { in: difficulties };
    }

    // Note: Source filtering would require adding source field to Question model
    // For now, we'll filter by source in memory after fetching
    const questions = await prisma.question.findMany({
      where,
      orderBy: { questionNumber: 'asc' },
    });

    let filteredQuestions = questions.map(q => ({
      question_number: q.questionNumber || q.questionId || 0,
      id: q.questionId || q.questionNumber || undefined,
      question: q.question,
      options: JSON.parse(q.options),
      correct_answer: q.correctAnswer,
      hint: q.hint || '',
      explanation: q.explanation || '',
      chapter: q.chapter || undefined,
      difficulty: (q.difficulty === 'easy' || q.difficulty === 'difficult') ? q.difficulty : undefined,
      source: q.source || undefined,
    }));

    // Filter by source if provided (in-memory filtering)
    if (sources && sources.length > 0) {
      filteredQuestions = filteredQuestions.filter(q => 
        q.source && sources.includes(q.source)
      );
    }

    return NextResponse.json(filteredQuestions);
  } catch (error) {
    console.error('Error loading filtered questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}

