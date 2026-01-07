import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

async function initializeDatabase() {
  try {
    // Check if database already has topics
    const topicCount = await prisma.topic.count();
    if (topicCount > 0) {
      return { initialized: false, message: 'Database already initialized', topicCount };
    }

    console.log('Initializing database...');

    // Load topics.json
    const topicsPath = join(process.cwd(), 'public', 'data', 'topics.json');
    const topicsData = JSON.parse(await readFile(topicsPath, 'utf-8'));

    // Handle both { topics: [...] } and [...] formats
    const topicsArray = Array.isArray(topicsData) ? topicsData : (topicsData.topics || []);

    // Create topics in database
    for (const topic of topicsArray) {
      await prisma.topic.upsert({
        where: { topicId: topic.id },
        update: {
          name: topic.name,
          description: topic.description,
          isGeneral: topic.isGeneral || false,
        },
        create: {
          topicId: topic.id,
          name: topic.name,
          description: topic.description,
          isGeneral: topic.isGeneral || false,
        },
      });
    }

    // Auto-discover and process database files
    const dataDir = join(process.cwd(), 'public', 'data');
    const files = await readdir(dataDir);
    const jsonFiles = files.filter(file => 
      file.endsWith('.json') && 
      file !== 'topics.json'
    ).sort();

    let totalQuestions = 0;

    for (const file of jsonFiles) {
      const filePath = join(dataDir, file);
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Handle array of chapters format
      const chapters = Array.isArray(data) ? data : [data];

      for (const chapterData of chapters) {
        const questions = chapterData.questions || [];
        const chapterName = chapterData.chapter || chapterData.chapterName || '';

        for (const q of questions) {
          const topicId = q.chapter 
            ? `chapter-${String(q.chapter).padStart(2, '0')}`
            : chapterName.toLowerCase().replace(/\s+/g, '-').replace(/chapter-?(\d+)/i, 'chapter-$1');

          // Find or create topic
          let topic = await prisma.topic.findUnique({ where: { topicId } });
          if (!topic && chapterName) {
            topic = await prisma.topic.create({
              data: {
                topicId,
                name: chapterName,
                description: '',
                isGeneral: false,
              },
            });
          }

          if (!topic) continue;

          const questionNumber = q.question_number || q.id || q.questionNumber || 0;
          const options = Array.isArray(q.options) ? JSON.stringify(q.options) : q.options;

          await prisma.question.upsert({
            where: {
              topicId_questionNumber: {
                topicId: topic.topicId,
                questionNumber,
              },
            },
            update: {
              question: q.question,
              options,
              correctAnswer: q.correct_answer || q.correctAnswer,
              hint: q.hint || null,
              explanation: q.explanation || null,
              chapter: q.chapter || topicId,
              difficulty: q.difficulty === 'easy' || q.difficulty === 'difficult' ? q.difficulty : null,
              source: q.source || file,
            },
            create: {
              topicId: topic.topicId,
              questionNumber,
              questionId: q.id || null,
              question: q.question,
              options,
              correctAnswer: q.correct_answer || q.correctAnswer,
              hint: q.hint || null,
              explanation: q.explanation || null,
              chapter: q.chapter || topicId,
              difficulty: q.difficulty === 'easy' || q.difficulty === 'difficult' ? q.difficulty : null,
              source: q.source || file,
            },
          });

          totalQuestions++;
        }
      }
    }

    return {
      initialized: true,
      message: 'Database initialized successfully',
      topicsCreated: await prisma.topic.count(),
      questionsCreated: totalQuestions,
    };
  } catch (error: any) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export async function POST() {
  try {
    const result = await initializeDatabase();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const topicCount = await prisma.topic.count();
    const questionCount = await prisma.question.count();
    
    return NextResponse.json({
      initialized: topicCount > 0,
      topicCount,
      questionCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check database status', details: error.message },
      { status: 500 }
    );
  }
}

