import { NextResponse } from 'next/server';
import { loadOfficialModelQuestions } from '@/lib/jsonUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Load all official model questions
    const allQuestions = await loadOfficialModelQuestions();
    
    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No official model questions found' },
        { status: 404 }
      );
    }

    // Return all questions in order (not shuffled)
    return NextResponse.json(allQuestions);
  } catch (error) {
    console.error('Error loading official model questions for learn mode:', error);
    return NextResponse.json(
      { error: 'Failed to load official model questions' },
      { status: 500 }
    );
  }
}

