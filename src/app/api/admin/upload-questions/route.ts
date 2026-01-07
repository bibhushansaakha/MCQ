import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
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

      // Update topics.json if needed
      const topicsPath = join(process.cwd(), 'public', 'data', 'topics.json');
      const topicsData = JSON.parse(await readFile(topicsPath, 'utf-8'));
      const topicsArray = Array.isArray(topicsData) ? topicsData : (topicsData.topics || []);
      
      const topicExists = topicsArray.find((t: any) => t.id === chapterTag);
      if (!topicExists) {
        topicsArray.push({
          id: chapterTag,
          name: topicName,
          file: '',
          description: topicDescription,
        });
        await writeFile(topicsPath, JSON.stringify({ topics: topicsArray }, null, 2), 'utf-8');
        results.topicsCreated++;
      } else {
        // Update existing topic
        const index = topicsArray.findIndex((t: any) => t.id === chapterTag);
        if (index >= 0) {
          topicsArray[index].name = topicName;
          topicsArray[index].description = topicDescription;
          await writeFile(topicsPath, JSON.stringify({ topics: topicsArray }, null, 2), 'utf-8');
          results.topicsUpdated++;
        }
      }

      // Write questions to a new JSON file or append to existing
      // For simplicity, create a new file with timestamp
      const timestamp = Date.now();
      const outputFileName = `NEC_UPLOADED_${timestamp}.json`;
      const outputPath = join(process.cwd(), 'public', 'data', outputFileName);
      
      // Format as array of chapters (matching existing format)
      const outputData = [{
        chapter: chapterInfo.metadata.chapter || topicName,
        chapter_code: chapterInfo.metadata.chapter_code || chapterTag.toUpperCase(),
        total_questions: chapterInfo.questions.length,
        set: chapterInfo.metadata.set || sourceName,
        question_type: chapterInfo.metadata.question_type || 'Mixed Questions',
        questions: chapterInfo.questions.map(q => ({
          id: q.id || q.question_number || 0,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          hint: q.hint || '',
          explanation: q.explanation || '',
          chapter: q.chapter || chapterInfo.metadata.chapter || topicName,
          difficulty: q.difficulty || null,
          marks: q.marks || null,
          source: q.source || chapterInfo.metadata.sourceFile || sourceName,
        })),
      }];

      await writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
      results.questionsImported = chapterInfo.questions.length;
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

