import { NextRequest, NextResponse } from 'next/server';
import { loadLearnQuestions } from '@/lib/jsonUtils';
import { Question } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { chapter: string } }
) {
  try {
    const { chapter } = params;
    const chapterNum = parseInt(chapter, 10);

    if (isNaN(chapterNum) || chapterNum < 1) {
      return NextResponse.json(
        { error: 'Invalid chapter number' },
        { status: 400 }
      );
    }

    const questions = await loadLearnQuestions(chapterNum);
    
    if (questions.length === 0) {
      return NextResponse.json(
        { error: `No questions found for chapter ${chapterNum}. Please check if the JSON files exist and are valid.` },
        { status: 404 }
      );
    }

    return NextResponse.json(questions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error('Error loading learn questions:', {
      chapter: params.chapter,
      error: errorMessage,
      details: errorDetails
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to load learn questions',
        details: errorMessage,
        chapter: params.chapter
      },
      { status: 500 }
    );
  }
}

