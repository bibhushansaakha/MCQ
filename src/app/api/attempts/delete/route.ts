import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionId, timestamp } = body;

    // Find the attempt by sessionId, questionId (questionNumber), and timestamp
    const attempt = await prisma.attempt.findFirst({
      where: {
        sessionId,
        questionNumber: questionId.toString(),
        timestamp: new Date(timestamp),
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Delete the attempt
    await prisma.attempt.delete({
      where: { id: attempt.id },
    });

    // Update session stats
    await prisma.session.update({
      where: { sessionId },
      data: {
        totalQuestions: { decrement: 1 },
        correctAnswers: attempt.correct ? { decrement: 1 } : undefined,
        wrongAnswers: !attempt.correct ? { decrement: 1 } : undefined,
        hintsUsed: attempt.hintUsed ? { decrement: 1 } : undefined,
        totalTime: { decrement: attempt.timeSpent },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Attempt deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to delete attempt', details: error.message },
      { status: 500 }
    );
  }
}



