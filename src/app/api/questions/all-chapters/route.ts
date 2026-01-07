import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Question, QuestionWithChapter } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const count = parseInt(searchParams.get('count') || '25', 10);

    // Get all chapter topics (chapter-01 through chapter-10)
    const chapterTopics = await prisma.topic.findMany({
      where: {
        topicId: {
          startsWith: 'chapter-',
        },
        isGeneral: false,
      },
      orderBy: { topicId: 'asc' },
    });

    // Filter to only chapter-01 through chapter-10
    const validChapters = chapterTopics.filter(
      topic => /^chapter-0[1-9]$|^chapter-10$/.test(topic.topicId)
    );

    if (validChapters.length === 0) {
      return NextResponse.json(
        { error: 'No chapters found' },
        { status: 404 }
      );
    }

    // Load questions from all chapters
    const allQuestions: QuestionWithChapter[] = [];
    
    for (const chapter of validChapters) {
      const questions = await prisma.question.findMany({
        where: { topicId: chapter.topicId },
        orderBy: { questionNumber: 'asc' },
      });

      const formattedQuestions: QuestionWithChapter[] = questions.map(q => ({
        question_number: q.questionNumber || q.questionId || 0,
        id: q.questionId || q.questionNumber || undefined,
        question: q.question,
        options: JSON.parse(q.options),
        correct_answer: q.correctAnswer,
        hint: q.hint || '',
        explanation: q.explanation || '',
        chapterId: chapter.topicId,
        chapter: q.chapter || undefined,
        difficulty: (q.difficulty === 'easy' || q.difficulty === 'difficult') ? q.difficulty : undefined,
        source: q.source || undefined,
      }));

      allQuestions.push(...formattedQuestions);
    }

    // Distribute questions equally across chapters
    const questionsPerChapter = Math.floor(count / validChapters.length);
    const remainder = count % validChapters.length;
    
    const selectedQuestions: QuestionWithChapter[] = [];
    const chapterQuestionMap = new Map<string, QuestionWithChapter[]>();
    
    // Group questions by chapter
    for (const question of allQuestions) {
      if (question.chapterId) {
        if (!chapterQuestionMap.has(question.chapterId)) {
          chapterQuestionMap.set(question.chapterId, []);
        }
        chapterQuestionMap.get(question.chapterId)!.push(question);
      }
    }

    // Select questions from each chapter
    for (let i = 0; i < validChapters.length; i++) {
      const chapterId = validChapters[i].topicId;
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

