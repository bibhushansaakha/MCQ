import { NextRequest, NextResponse } from 'next/server';
import { loadAllQuestionsFromJson } from '@/lib/jsonUtils';
import { Question } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapters, difficulties, sources, topicId } = body;

    // Load all questions
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

    // Filter by chapters if provided
    if (chapters && chapters.length > 0) {
      const chapterNums = chapters.map((ch: string) => {
        const match = ch.match(/chapter-(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      }).filter(Boolean);
      
      questions = questions.filter(q => {
        if (!q.chapter) return false;
        const match = String(q.chapter).match(/(\d+)/);
        if (!match) return false;
        return chapterNums.includes(parseInt(match[1], 10));
      });
    }

    // Filter by difficulties if provided
    if (difficulties && difficulties.length > 0) {
      questions = questions.filter(q => 
        q.difficulty && difficulties.includes(q.difficulty)
      );
    }

    // Filter by sources if provided
    if (sources && sources.length > 0) {
      questions = questions.filter(q => 
        q.source && sources.includes(q.source)
      );
    }

    // Sort by question number
    const sorted = questions.sort((a, b) => 
      (a.question_number || 0) - (b.question_number || 0)
    );

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error loading filtered questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}

