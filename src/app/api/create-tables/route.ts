import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('Creating tables using raw SQL...');

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
    } catch (e: any) {
      console.log('Foreign key might already exist:', e.message);
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
    } catch (e: any) {
      console.log('Foreign key might already exist:', e.message);
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
    } catch (e: any) {
      console.log('Foreign key might already exist:', e.message);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tables created successfully using raw SQL' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to create tables', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to create tables',
    usage: 'POST /api/create-tables'
  });
}

