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

  // First try creating tables directly with raw SQL (most reliable)
  try {
    console.log('Creating tables using raw SQL...');
    const { prisma } = await import('@/lib/prisma');
    
    // Create Topic table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Topic" (
        "id" TEXT NOT NULL,
        "topicId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "isGeneral" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Topic_topicId_key" ON "Topic"("topicId");
    `);

    // Create Question table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Question" (
        "id" TEXT NOT NULL,
        "topicId" TEXT NOT NULL,
        "questionNumber" INTEGER,
        "questionId" INTEGER,
        "question" TEXT NOT NULL,
        "options" TEXT NOT NULL,
        "correctAnswer" TEXT NOT NULL,
        "hint" TEXT,
        "explanation" TEXT,
        "questionType" TEXT,
        "marks" INTEGER,
        "source" TEXT,
        "relatedSection" TEXT,
        "chapter" TEXT,
        "difficulty" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Question_topicId_questionNumber_key" 
      ON "Question"("topicId", "questionNumber");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Question_topicId_idx" ON "Question"("topicId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Question_chapter_idx" ON "Question"("chapter");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Question_difficulty_idx" ON "Question"("difficulty");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Question_chapter_difficulty_idx" 
      ON "Question"("chapter", "difficulty");
    `);

    // Create Session table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "topicId" TEXT NOT NULL,
        "examMode" TEXT,
        "startTime" TIMESTAMP(3) NOT NULL,
        "endTime" TIMESTAMP(3),
        "totalQuestions" INTEGER NOT NULL DEFAULT 0,
        "correctAnswers" INTEGER NOT NULL DEFAULT 0,
        "wrongAnswers" INTEGER NOT NULL DEFAULT 0,
        "hintsUsed" INTEGER NOT NULL DEFAULT 0,
        "totalTime" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionId_key" ON "Session"("sessionId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Session_topicId_idx" ON "Session"("topicId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Session_startTime_idx" ON "Session"("startTime");
    `);

    // Create Attempt table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Attempt" (
        "id" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "questionId" TEXT NOT NULL,
        "questionNumber" TEXT NOT NULL,
        "correct" BOOLEAN NOT NULL,
        "timeSpent" INTEGER NOT NULL,
        "hintUsed" BOOLEAN NOT NULL DEFAULT false,
        "explanationViewed" BOOLEAN NOT NULL DEFAULT false,
        "timestamp" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Attempt_sessionId_idx" ON "Attempt"("sessionId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Attempt_questionId_idx" ON "Attempt"("questionId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Attempt_timestamp_idx" ON "Attempt"("timestamp");
    `);

    // Add foreign keys (ignore errors if they already exist)
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'Question_topicId_fkey'
          ) THEN
            ALTER TABLE "Question" 
            ADD CONSTRAINT "Question_topicId_fkey" 
            FOREIGN KEY ("topicId") REFERENCES "Topic"("topicId") 
            ON DELETE RESTRICT ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
    } catch (e) {
      // Ignore - constraint might already exist
    }

    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'Attempt_sessionId_fkey'
          ) THEN
            ALTER TABLE "Attempt" 
            ADD CONSTRAINT "Attempt_sessionId_fkey" 
            FOREIGN KEY ("sessionId") REFERENCES "Session"("sessionId") 
            ON DELETE RESTRICT ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
    } catch (e) {
      // Ignore
    }

    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'Attempt_questionId_fkey'
          ) THEN
            ALTER TABLE "Attempt" 
            ADD CONSTRAINT "Attempt_questionId_fkey" 
            FOREIGN KEY ("questionId") REFERENCES "Question"("id") 
            ON DELETE RESTRICT ON UPDATE CASCADE;
          END IF;
        END $$;
      `);
    } catch (e) {
      // Ignore
    }

    console.log('✓ Tables created successfully using raw SQL');
    return true;
  } catch (sqlError: any) {
    console.error('Raw SQL creation failed:', sqlError.message);
    // Fallback to Prisma commands
    try {
      console.log('Trying Prisma db push...');
      execSync('npx prisma db push --accept-data-loss --skip-generate', { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      console.log('✓ Schema pushed successfully');
      return true;
    } catch (pushError: any) {
      console.error('Schema push failed:', pushError.message);
      // Last resort: try migrations
      try {
        console.log('Trying migrations as last resort...');
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          env: { ...process.env }
        });
        console.log('✓ Migrations applied successfully');
        return true;
      } catch (migrationError: any) {
        console.error('Migrations also failed:', migrationError.message);
        throw new Error(`All methods failed. SQL error: ${sqlError.message}. Push error: ${pushError.message}. Migration error: ${migrationError.message}`);
      }
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
    // Always initialize - upsert will handle duplicates
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
          // Extract topicId from chapter name or chapterData
          let topicId: string | null = null;
          
          // Try to extract chapter number from q.chapter (e.g., "Chapter 1: Electrical & Electronics")
          if (q.chapter) {
            const chapterMatch = String(q.chapter).match(/chapter-?(\d+)/i);
            if (chapterMatch) {
              topicId = `chapter-${chapterMatch[1].padStart(2, '0')}`;
            } else {
              // Fallback: try to extract any number from the chapter string
              const numMatch = String(q.chapter).match(/(\d+)/);
              if (numMatch) {
                topicId = `chapter-${numMatch[1].padStart(2, '0')}`;
              }
            }
          }
          
          // If still no topicId, try to extract from chapterName
          if (!topicId && chapterName) {
            const chapterNameMatch = chapterName.match(/chapter-?(\d+)/i);
            if (chapterNameMatch) {
              topicId = `chapter-${chapterNameMatch[1].padStart(2, '0')}`;
            } else {
              // Fallback: try to extract any number from chapterName
              const numMatch = chapterName.match(/(\d+)/);
              if (numMatch) {
                topicId = `chapter-${numMatch[1].padStart(2, '0')}`;
              } else {
                // Last resort: normalize chapterName
                const normalized = chapterName.toLowerCase().replace(/\s+/g, '-');
                const normalizedMatch = normalized.match(/chapter-?(\d+)/);
                if (normalizedMatch) {
                  topicId = `chapter-${normalizedMatch[1].padStart(2, '0')}`;
                }
              }
            }
          }
          
          if (!topicId) {
            console.warn(`Could not determine topicId for question in chapter: ${chapterName || q.chapter}`);
            continue;
          }

          // Find or create topic - use topics.json as source of truth for names
          let topic = await prisma.topic.findUnique({ where: { topicId } });
          if (!topic) {
            // Try to find topic name from topics.json
            const topicsPath = join(process.cwd(), 'public', 'data', 'topics.json');
            let topicName = chapterName;
            try {
              const topicsData = JSON.parse(await readFile(topicsPath, 'utf-8'));
              const topicsArray = Array.isArray(topicsData) ? topicsData : (topicsData.topics || []);
              const topicFromJson = topicsArray.find((t: any) => t.id === topicId);
              if (topicFromJson) {
                topicName = topicFromJson.name;
              }
            } catch (e) {
              // If topics.json doesn't exist or can't be read, use chapterName
            }
            
            topic = await prisma.topic.create({
              data: {
                topicId,
                name: topicName || chapterName || `Chapter ${topicId.replace('chapter-', '')}`,
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
    
    // If database is empty, automatically initialize it
    if (topicCount === 0) {
      try {
        console.log('Database is empty, auto-initializing...');
        const result = await initializeDatabase();
        // Re-check counts after initialization
        topicCount = await prisma.topic.count();
        questionCount = await prisma.question.count();
        return NextResponse.json({
          initialized: true,
          message: 'Database auto-initialized successfully',
          topicCount,
          questionCount,
          autoInitialized: true,
        });
      } catch (initError: any) {
        return NextResponse.json({
          initialized: false,
          error: 'Auto-initialization failed',
          details: initError.message,
          topicCount: 0,
          questionCount: 0,
          action: 'Please try POST /api/init-db to initialize manually',
        });
      }
    }
    
    return NextResponse.json({
      initialized: true,
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

