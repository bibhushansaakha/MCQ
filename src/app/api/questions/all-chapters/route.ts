import { NextRequest, NextResponse } from 'next/server';
import { loadAllQuestionsFromJson, loadTopicsFromJson } from '@/lib/jsonUtils';
import { QuestionWithChapter } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const count = parseInt(searchParams.get('count') || '25', 10);

    // Get all chapter topics (chapter-01 through chapter-10)
    const topics = await loadTopicsFromJson();
    const validChapters = topics.filter(
      topic => /^chapter-0[1-9]$|^chapter-10$/.test(topic.id)
    );

    if (validChapters.length === 0) {
      return NextResponse.json(
        { error: 'No chapters found' },
        { status: 404 }
      );
    }

    // Load all questions
    const allQuestions = await loadAllQuestionsFromJson();
    
    // Group questions by chapterId
    const chapterQuestionMap = new Map<string, QuestionWithChapter[]>();
    
    for (const question of allQuestions) {
      if (!question.chapter) continue;
      const match = String(question.chapter).match(/(\d+)/);
      if (!match) continue;
      const chapterId = `chapter-${match[1].padStart(2, '0')}`;
      
      if (!chapterQuestionMap.has(chapterId)) {
        chapterQuestionMap.set(chapterId, []);
      }
      
      chapterQuestionMap.get(chapterId)!.push({
        ...question,
        chapterId,
      });
    }

    // Distribute questions equally across chapters
    const questionsPerChapter = Math.floor(count / validChapters.length);
    const remainder = count % validChapters.length;
    
    const selectedQuestions: QuestionWithChapter[] = [];

    // Select questions from each chapter
    for (let i = 0; i < validChapters.length; i++) {
      const chapterId = validChapters[i].id;
      const chapterQuestions = chapterQuestionMap.get(chapterId) || [];
      
      // Shuffle chapter questions
      const shuffled = [...chapterQuestions];
      for (let j = shuffled.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
      }
      
      // Take questions per chapter, plus one extra for first 'remainder' chapters
      const takeCount = questionsPerChapter + (i < remainder ? 1 : 0);
      selectedQuestions.push(...shuffled.slice(0, Math.min(takeCount, shuffled.length)));
    }

    // Shuffle final selection
    const finalShuffled = [...selectedQuestions];
    for (let i = finalShuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [finalShuffled[i], finalShuffled[j]] = [finalShuffled[j], finalShuffled[i]];
    }

    // Return only the requested count
    return NextResponse.json(finalShuffled.slice(0, count));
  } catch (error) {
    console.error('Error loading questions from all chapters:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}

