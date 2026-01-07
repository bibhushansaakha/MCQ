import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Question } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chapter = searchParams.get('chapter');
    const difficulty = searchParams.get('difficulty');
    const topicId = searchParams.get('topicId');

    // Build where clause dynamically based on provided filters
    const where: any = {};

    if (topicId) {
      where.topicId = topicId;
    }

    if (chapter) {
      where.chapter = chapter;
    }

    if (difficulty) {
      // Validate difficulty value
      if (difficulty === 'easy' || difficulty === 'difficult') {
        where.difficulty = difficulty;
      }
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: { questionNumber: 'asc' },
    });

    const formattedQuestions: Question[] = questions.map(q => ({
      question_number: q.questionNumber || q.questionId || 0,
      id: q.questionId || q.questionNumber || undefined,
      question: q.question,
      options: JSON.parse(q.options),
      correct_answer: q.correctAnswer,
      hint: q.hint || '',
      explanation: q.explanation || '',
      chapter: q.chapter || undefined,
      difficulty: (q.difficulty === 'easy' || q.difficulty === 'difficult') ? q.difficulty : undefined,
    }));

    return NextResponse.json(formattedQuestions);
  } catch (error) {
    console.error('Error loading filtered questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}

