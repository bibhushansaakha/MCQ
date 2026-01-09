import { NextResponse } from 'next/server';
import { loadPersonalQuestions } from '@/lib/jsonUtils';
import { QuestionWithChapter } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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

    // Return all questions in order (not shuffled for learn mode)
    return NextResponse.json(questionsWithChapter);
  } catch (error) {
    console.error('Error loading personal questions:', error);
    return NextResponse.json(
      { error: 'Failed to load personal questions' },
      { status: 500 }
    );
  }
}
