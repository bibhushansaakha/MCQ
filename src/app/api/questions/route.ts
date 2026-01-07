import { NextRequest, NextResponse } from 'next/server';
import { loadAllQuestionsFromJson } from '@/lib/jsonUtils';
import { Question } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chapter = searchParams.get('chapter');
    const difficulty = searchParams.get('difficulty');
    const topicId = searchParams.get('topicId');

    let questions = await loadAllQuestionsFromJson();

    // Filter by topicId if provided
    if (topicId) {
      const chapterMatch = topicId.match(/chapter-(\d+)/);
      if (chapterMatch) {
        const chapterNum = parseInt(chapterMatch[1], 10);
        questions = questions.filter(q => {
          if (!q.chapter) return false;
          const qMatch = String(q.chapter).match(/(\d+)/);
          if (!qMatch) return false;
          return parseInt(qMatch[1], 10) === chapterNum;
        });
      }
    }

    // Filter by chapter if provided
    if (chapter) {
      const chapterMatch = chapter.match(/chapter-(\d+)/);
      if (chapterMatch) {
        const chapterNum = parseInt(chapterMatch[1], 10);
        questions = questions.filter(q => {
          if (!q.chapter) return false;
          const qMatch = String(q.chapter).match(/(\d+)/);
          if (!qMatch) return false;
          return parseInt(qMatch[1], 10) === chapterNum;
        });
      }
    }

    // Filter by difficulty if provided
    if (difficulty && (difficulty === 'easy' || difficulty === 'difficult')) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }

    // Sort by question number
    const sorted = questions.sort((a, b) => 
      (a.question_number || 0) - (b.question_number || 0)
    );

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error loading questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}

