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

    // Debug logging
    console.log(`[DEBUG] Querying questions for topicId: ${topicId}`);

    // Query by topicId only - questions are already linked to topics via topicId
    // The chapter field stores full names like "Chapter 1: Electrical & Electronics"
    // while topicId is "chapter-01", so we don't filter by chapter field
    const questions = await prisma.question.findMany({
      where: { topicId },
      orderBy: { questionNumber: 'asc' },
    });

    // Debug logging
    console.log(`[DEBUG] Found ${questions.length} questions for topicId: ${topicId}`);
    if (questions.length === 0) {
      // Check if topic exists
      const topic = await prisma.topic.findUnique({ where: { topicId } });
      console.log(`[DEBUG] Topic ${topicId} exists: ${topic ? 'YES' : 'NO'}`);
      
      // Check total questions in database
      const totalQuestions = await prisma.question.count();
      console.log(`[DEBUG] Total questions in database: ${totalQuestions}`);
      
      // Check what topicIds exist in questions table
      const allQuestions = await prisma.question.findMany({
        select: { topicId: true },
        take: 10,
      });
      const uniqueTopicIds = [...new Set(allQuestions.map(q => q.topicId))];
      console.log(`[DEBUG] Sample topicIds in questions table: ${uniqueTopicIds.join(', ')}`);
    } else {
      console.log(`[DEBUG] Sample question topicId: ${questions[0].topicId}, questionNumber: ${questions[0].questionNumber}`);
    }

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

