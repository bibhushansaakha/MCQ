import { NextRequest, NextResponse } from 'next/server';
import { loadQuestionsForTopic } from '@/lib/jsonUtils';
import { Question } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const { topicId } = params;

    const questions = await loadQuestionsForTopic(topicId);
    
    // Sort by question number
    const sortedQuestions: Question[] = questions.sort((a, b) => 
      (a.question_number || 0) - (b.question_number || 0)
    );

    return NextResponse.json(sortedQuestions);
  } catch (error) {
    console.error('Error loading questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}

