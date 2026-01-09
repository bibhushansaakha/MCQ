import { NextResponse } from 'next/server';
import { loadPastQuestions } from '@/lib/jsonUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Load all past questions
    const allQuestions = await loadPastQuestions();
    
    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No past questions found' },
        { status: 404 }
      );
    }

    // Return all questions in order (not shuffled)
    return NextResponse.json(allQuestions);
  } catch (error) {
    console.error('Error loading past questions for learn mode:', error);
    return NextResponse.json(
      { error: 'Failed to load past questions' },
      { status: 500 }
    );
  }
}

