import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

async function ensureMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // First try db push (more reliable for initial setup on Vercel)
  try {
    console.log('Pushing schema to database...');
    execSync('npx prisma db push --accept-data-loss --skip-generate', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✓ Schema pushed successfully');
    return true;
  } catch (pushError: any) {
    console.error('Schema push failed:', pushError.message);
    // Fallback to migrations
    try {
      console.log('Trying migrations as fallback...');
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      console.log('✓ Migrations applied successfully');
      return true;
    } catch (migrationError: any) {
      console.error('Migrations also failed:', migrationError.message);
      throw new Error(`Both schema push and migrations failed. Push error: ${pushError.message}. Migration error: ${migrationError.message}`);
    }
  }
}

async function initializeDatabase() {
  try {
    // Ensure migrations are applied first - THIS IS CRITICAL
    console.log('Step 1: Ensuring migrations are applied...');
    await ensureMigrations();
    
    // Small delay to ensure tables are created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if database already has topics
    console.log('Step 2: Checking existing topics...');
    let topicCount = 0;
    try {
      topicCount = await prisma.topic.count();
    } catch (countError: any) {
      // If count fails, tables might not exist yet - try migrations again
      if (countError.message?.includes('does not exist')) {
        console.log('Tables still don\'t exist, trying schema push...');
        execSync('npx prisma db push --accept-data-loss', {
          stdio: 'inherit',
          env: { ...process.env }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        topicCount = await prisma.topic.count();
      } else {
        throw countError;
      }
    }
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
    // Ensure migrations run first
    try {
      await ensureMigrations();
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (migrationError: any) {
      return NextResponse.json(
        { 
          error: 'Migrations failed - cannot initialize database', 
          details: migrationError.message,
          suggestion: 'Try visiting /api/migrate first to run migrations manually'
        },
        { status: 500 }
      );
    }

    const result = await initializeDatabase();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Database initialization error:', error);
    
    // Check if it's a "table does not exist" error
    if (error.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Database tables do not exist', 
          details: error.message,
          suggestion: 'Please visit /api/migrate first to create tables, then try again'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize database', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // First ensure migrations are run
    try {
      await ensureMigrations();
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (migrationError: any) {
      return NextResponse.json({
        initialized: false,
        error: 'Migrations failed',
        details: migrationError.message,
        topicCount: 0,
        questionCount: 0,
        action: 'Please try running migrations manually via POST /api/migrate',
      });
    }

    let topicCount = 0;
    let questionCount = 0;
    
    try {
      topicCount = await prisma.topic.count();
      questionCount = await prisma.question.count();
    } catch (error: any) {
      // If tables don't exist, this will catch it
      if (error.message?.includes('does not exist')) {
        return NextResponse.json({
          initialized: false,
          error: 'Tables do not exist',
          details: error.message,
          topicCount: 0,
          questionCount: 0,
          action: 'Tables need to be created. Try POST /api/migrate first, then POST /api/init-db',
        });
      }
      throw error;
    }
    
    return NextResponse.json({
      initialized: topicCount > 0,
      topicCount,
      questionCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to check database status', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

