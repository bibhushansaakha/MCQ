import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const session = await prisma.session.findUnique({
      where: { sessionId },
      include: {
        attempts: {
          include: {
            question: true, // Include the actual question data
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Transform to match SessionData format
    const formattedSession = {
      sessionId: session.sessionId,
      topic: session.topicId,
      examMode: session.examMode as string | undefined,
      startTime: session.startTime.getTime(),
      endTime: session.endTime?.getTime(),
      attempts: session.attempts.map(attempt => ({
        questionId: attempt.questionNumber,
        topic: session.topicId,
        correct: attempt.correct,
        timeSpent: attempt.timeSpent,
        hintUsed: attempt.hintUsed,
        explanationViewed: attempt.explanationViewed,
        timestamp: attempt.timestamp.getTime(),
        // Include question data if available
        question: attempt.question ? {
          question_number: attempt.question.questionNumber || attempt.question.questionId || 0,
          id: attempt.question.questionId || attempt.question.questionNumber || undefined,
          question: attempt.question.question,
          options: JSON.parse(attempt.question.options),
          correct_answer: attempt.question.correctAnswer,
          hint: attempt.question.hint || '',
          explanation: attempt.question.explanation || '',
          chapterId: attempt.question.topicId, // For exam mode questions
        } : null,
      })),
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      wrongAnswers: session.wrongAnswers,
      hintsUsed: session.hintsUsed,
      totalTime: session.totalTime,
    };

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await request.json();

    const updateData: any = {};
    if (body.endTime !== undefined) {
      updateData.endTime = new Date(body.endTime);
    }
    if (body.totalQuestions !== undefined) {
      updateData.totalQuestions = body.totalQuestions;
    }
    if (body.correctAnswers !== undefined) {
      updateData.correctAnswers = body.correctAnswers;
    }
    if (body.wrongAnswers !== undefined) {
      updateData.wrongAnswers = body.wrongAnswers;
    }
    if (body.hintsUsed !== undefined) {
      updateData.hintsUsed = body.hintsUsed;
    }
    if (body.totalTime !== undefined) {
      updateData.totalTime = body.totalTime;
    }

    const session = await prisma.session.update({
      where: { sessionId },
      data: updateData,
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    // Delete all attempts for this session first (due to foreign key constraint)
    await prisma.attempt.deleteMany({
      where: { sessionId },
    });

    // Delete the session
    await prisma.session.delete({
      where: { sessionId },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

