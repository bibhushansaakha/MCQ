import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, topicId, examMode, startTime } = body;

    const session = await prisma.session.create({
      data: {
        sessionId,
        topicId,
        examMode: examMode || null,
        startTime: new Date(startTime),
      },
    });

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        attempts: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Transform to match SessionData format
    const formattedSessions = sessions.map(session => ({
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
      })),
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      wrongAnswers: session.wrongAnswers,
      hintsUsed: session.hintsUsed,
      totalTime: session.totalTime,
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

