import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    sessionId,
    questionId,
    questionNumber,
    correct,
    timeSpent,
    hintUsed,
    explanationViewed,
    timestamp,
  } = body;

  try {

    // Find the question by topicId and questionNumber
    // First, get the session to find topicId
    const session = await prisma.session.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // For exam mode (all-chapters), we need to find the question differently
    // The topic field in the attempt contains the chapterId
    let question = null;
    
    if (session.topicId === 'all-chapters') {
      // For exam mode, try to find question by ID across all chapters
      // First try to find by questionId if it's a number
      const questionIdNum = parseInt(questionId);
      if (!isNaN(questionIdNum)) {
        question = await prisma.question.findFirst({
          where: {
            OR: [
              { questionId: questionIdNum },
              { questionNumber: questionIdNum },
            ],
          },
        });
      }
      
      // If not found, try to find by questionNumber in any chapter
      if (!question) {
        question = await prisma.question.findFirst({
          where: {
            questionNumber: parseInt(questionNumber) || undefined,
          },
        });
      }
    } else {
      // For regular chapterwise mode, find by topicId and questionNumber
      question = await prisma.question.findFirst({
        where: {
          topicId: session.topicId,
          questionNumber: parseInt(questionNumber) || undefined,
        },
      });
    }

    // If question not found, we'll still create the attempt but without questionId reference
    // This can happen for exam mode questions
    // Use a placeholder question ID if question not found
    let questionIdToUse = 'unknown';
    if (question) {
      questionIdToUse = question.id;
    } else {
      // Try to find any question to use as placeholder, or create a dummy one
      const anyQuestion = await prisma.question.findFirst();
      if (anyQuestion) {
        questionIdToUse = anyQuestion.id;
      }
    }

    const attempt = await prisma.attempt.create({
      data: {
        sessionId,
        questionId: questionIdToUse,
        questionNumber: questionNumber.toString(),
        correct,
        timeSpent,
        hintUsed: hintUsed || false,
        explanationViewed: explanationViewed || false,
        timestamp: new Date(timestamp),
      },
    });

    // Update session stats
    await prisma.session.update({
      where: { sessionId },
      data: {
        totalQuestions: { increment: 1 },
        correctAnswers: correct ? { increment: 1 } : undefined,
        wrongAnswers: !correct ? { increment: 1 } : undefined,
        hintsUsed: hintUsed ? { increment: 1 } : undefined,
        totalTime: { increment: timeSpent },
      },
    });

    return NextResponse.json(attempt);
  } catch (error: any) {
    console.error('Error creating attempt:', error);
    console.error('Attempt data:', {
      sessionId,
      questionId,
      questionNumber,
      correct,
      timeSpent,
    });
    return NextResponse.json(
      { error: 'Failed to create attempt', details: error.message },
      { status: 500 }
    );
  }
}

