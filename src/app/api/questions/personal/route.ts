import { NextRequest, NextResponse } from 'next/server';
import { loadPersonalQuestions } from '@/lib/jsonUtils';
import { QuestionWithChapter } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const count = parseInt(searchParams.get('count') || '0', 10);

    // Load all personal questions
    const allQuestions = await loadPersonalQuestions();
    
    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No personal questions found' },
        { status: 404 }
      );
    }

    // Convert to QuestionWithChapter format
    const questionsWithChapter: QuestionWithChapter[] = allQuestions.map(q => ({
      ...q,
      chapterId: q.chapter || 'personal',
    }));

    // If count is specified and > 0, shuffle and return that many
    if (count > 0) {
      // Shuffle questions
      const shuffled = [...questionsWithChapter];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      return NextResponse.json(shuffled.slice(0, Math.min(count, shuffled.length)));
    }

    // Otherwise return all questions
    return NextResponse.json(questionsWithChapter);
  } catch (error) {
    console.error('Error loading personal questions:', error);
    return NextResponse.json(
      { error: 'Failed to load personal questions' },
      { status: 500 }
    );
  }
}
