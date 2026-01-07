import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface QuestionData {
  id?: number;
  question_number?: number;
  question: string;
  options: string[];
  correct_answer: string;
  hint?: string;
  explanation?: string;
  chapter?: string;
  difficulty?: string;
  source?: string;
  marks?: number;
  question_type?: string;
}

interface ChapterData {
  chapter?: string;
  chapter_code?: string;
  questions: QuestionData[];
  set?: string;
  total_questions?: number;
  question_type?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sourceName = formData.get('sourceName') as string || 'Uploaded';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    let data: ChapterData[];

    try {
      data = JSON.parse(text);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    // Validate format
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'JSON must be an array of chapter objects' },
        { status: 400 }
      );
    }

    // Load topics.json to get correct topic names
    const topicsPath = join(process.cwd(), 'public', 'data', 'topics.json');
    const topicsData = JSON.parse(await readFile(topicsPath, 'utf-8'));
    const topicsMap = new Map<string, { name: string; description: string; id: string }>(
      topicsData.topics.map((t: any) => [t.id, { name: t.name, description: t.description, id: t.id }])
    );

    const results = {
      topicsCreated: 0,
      topicsUpdated: 0,
      questionsImported: 0,
      questionsUpdated: 0,
      errors: [] as string[],
    };

    // Group questions by chapter
    const questionsByChapter = new Map<string, { questions: QuestionData[], metadata: any }>();

    for (const chapterData of data) {
      if (!chapterData.questions || !Array.isArray(chapterData.questions)) {
        results.errors.push('Invalid chapter entry: missing questions array');
        continue;
      }

      for (const question of chapterData.questions) {
        // Validate question structure
        if (!question.question || !question.options || !question.correct_answer) {
          results.errors.push('Invalid question: missing required fields');
          continue;
        }

        // Determine chapter tag - convert "Chapter 1: Electrical & Electronics" to "chapter-01"
        let chapterTag = question.chapter;
        
        // Convert chapter name format to chapter tag
        if (chapterTag && typeof chapterTag === 'string') {
          const chapterMatch = chapterTag.match(/Chapter\s+(\d+)/i);
          if (chapterMatch) {
            const chapterNum = chapterMatch[1].padStart(2, '0');
            chapterTag = `chapter-${chapterNum}`;
            question.chapter = chapterTag; // Update the question's chapter field
          }
        }
        
        // If still no chapter tag, try to derive from chapterData.chapter
        if (!chapterTag && chapterData.chapter) {
          const chapterMatch = chapterData.chapter.match(/Chapter\s+(\d+)/i);
          if (chapterMatch) {
            const chapterNum = chapterMatch[1].padStart(2, '0');
            chapterTag = `chapter-${chapterNum}`;
            question.chapter = chapterTag;
          }
        }

        const finalChapterTag = chapterTag || 'unknown';

        if (!questionsByChapter.has(finalChapterTag)) {
          questionsByChapter.set(finalChapterTag, {
            questions: [],
            metadata: {
              chapter: chapterData.chapter,
              chapter_code: chapterData.chapter_code,
              set: chapterData.set || sourceName,
              sourceFile: sourceName,
            },
          });
        }

        questionsByChapter.get(finalChapterTag)!.questions.push(question);
      }
    }

    // Process each chapter
    for (const [chapterTag, chapterInfo] of questionsByChapter.entries()) {
      if (chapterTag === 'unknown') {
        results.errors.push('Questions with unknown chapter tag skipped');
        continue;
      }

      // Get topic info from topics.json
      const topicFromJson = topicsMap.get(chapterTag);
      const topicName = topicFromJson?.name || chapterInfo.metadata.chapter || `Chapter ${chapterTag}`;
      const topicDescription = topicFromJson?.description || `${topicName}${chapterInfo.metadata.set ? ` - ${chapterInfo.metadata.set}` : ''} (from ${chapterInfo.metadata.sourceFile})`;

      // Create or update topic
      const existingTopic = await prisma.topic.findUnique({
        where: { topicId: chapterTag },
      });

      if (existingTopic) {
        await prisma.topic.update({
          where: { topicId: chapterTag },
          data: {
            name: topicName,
            description: topicDescription,
          },
        });
        results.topicsUpdated++;
      } else {
        await prisma.topic.create({
          data: {
            topicId: chapterTag,
            name: topicName,
            description: topicDescription,
            isGeneral: false,
          },
        });
        results.topicsCreated++;
      }

      // Import questions
      for (const q of chapterInfo.questions) {
        const questionNumber = q.id || q.question_number || 0;
        const questionId = q.id || q.question_number;

        // Normalize difficulty
        let difficulty: string | null = null;
        if (q.difficulty) {
          const diffLower = q.difficulty.toLowerCase();
          if (diffLower === 'easy') {
            difficulty = 'easy';
          } else if (diffLower === 'difficult' || diffLower === 'hard') {
            difficulty = 'difficult';
          }
        }

        try {
          const existing = await prisma.question.findUnique({
            where: {
              topicId_questionNumber: {
                topicId: chapterTag,
                questionNumber,
              },
            },
          });

          if (existing) {
            await prisma.question.update({
              where: { id: existing.id },
              data: {
                question: q.question,
                options: JSON.stringify(q.options),
                correctAnswer: q.correct_answer,
                hint: q.hint || null,
                explanation: q.explanation || null,
                questionType: q.question_type || null,
                marks: q.marks || null,
                source: q.source || chapterInfo.metadata.sourceFile || null,
                chapter: chapterTag,
                difficulty,
              },
            });
            results.questionsUpdated++;
          } else {
            await prisma.question.create({
              data: {
                topicId: chapterTag,
                questionNumber,
                questionId: questionId || null,
                question: q.question,
                options: JSON.stringify(q.options),
                correctAnswer: q.correct_answer,
                hint: q.hint || null,
                explanation: q.explanation || null,
                questionType: q.question_type || null,
                marks: q.marks || null,
                source: q.source || chapterInfo.metadata.sourceFile || null,
                chapter: chapterTag,
                difficulty,
              },
            });
            results.questionsImported++;
          }
        } catch (error: any) {
          results.errors.push(`Error importing question ${questionNumber}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Questions imported successfully',
      results,
    });
  } catch (error: any) {
    console.error('Error uploading questions:', error);
    return NextResponse.json(
      { error: 'Failed to upload questions', details: error.message },
      { status: 500 }
    );
  }
}

