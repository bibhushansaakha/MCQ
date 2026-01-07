import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Question } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const { topicId } = params;
    const searchParams = request.nextUrl.searchParams;
    const chapters = searchParams.get('chapters')?.split(',').filter(Boolean) || [];

    // Build where clause
    const where: any = { topicId };
    
    // If topicId is a chapter topic and chapters filter is provided, filter by chapter field
    // This ensures chapter practice mode only shows questions from that specific chapter
    if (topicId.startsWith('chapter-') && chapters.length > 0) {
      // Use the chapter filter (should match the topicId)
      where.chapter = { in: chapters };
    } else if (topicId.startsWith('chapter-')) {
      // If no explicit filter but it's a chapter topic, filter by chapter matching topicId
      where.chapter = topicId;
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

