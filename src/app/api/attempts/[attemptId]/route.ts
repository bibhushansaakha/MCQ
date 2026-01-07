import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;

    // Find the attempt to get session info
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { session: true },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    const sessionId = attempt.sessionId;

    // Delete the attempt
    await prisma.attempt.delete({
      where: { id: attemptId },
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
  } catch (error) {
    console.error('Error deleting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to delete attempt' },
      { status: 500 }
    );
  }
}



