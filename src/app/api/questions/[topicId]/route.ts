import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Question } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const { topicId } = params;

    // Query by topicId only - questions are already linked to topics via topicId
    // The chapter field stores full names like "Chapter 1: Electrical & Electronics"
    // while topicId is "chapter-01", so we don't filter by chapter field
    const questions = await prisma.question.findMany({
      where: { topicId },
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
      source: q.source || undefined,
    }));

    return NextResponse.json(formattedQuestions);
  } catch (error) {
    console.error('Error loading questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}

