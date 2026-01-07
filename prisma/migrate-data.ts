import { PrismaClient } from '@prisma/client';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

// Auto-discover database files (all JSON files except topics.json)
async function discoverDatabaseFiles(): Promise<string[]> {
  const dataDir = join(process.cwd(), 'public', 'data');
  try {
    const files = await readdir(dataDir);
    return files.filter(file => 
      file.endsWith('.json') && 
      file !== 'topics.json'
    ).sort(); // Sort for consistent processing order
  } catch (error) {
    console.error('Error discovering database files:', error);
    return [];
  }
}

async function migrateData() {
  try {
    console.log('Starting data migration...');

    // Load topics.json
    const topicsPath = join(process.cwd(), 'public', 'data', 'topics.json');
    const topicsData = JSON.parse(await readFile(topicsPath, 'utf-8'));

    // Create topics in database
    for (const topic of topicsData.topics) {
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
      console.log(`✓ Created/Updated topic: ${topic.name}`);
    }

    // Auto-discover and process database files (new format - array of chapters)
    const dataDir = join(process.cwd(), 'public', 'data');
    const databaseFiles = await discoverDatabaseFiles();
    
    if (databaseFiles.length > 0) {
      console.log(`\n📚 Found ${databaseFiles.length} database file(s) to process`);
    }
    
    for (const dbFile of databaseFiles) {
      const dbFilePath = join(dataDir, dbFile);
      try {
        console.log(`\n📂 Processing database file: ${dbFile}`);
        const dbData = JSON.parse(await readFile(dbFilePath, 'utf-8'));
        
        // Check if it's the new format (array of chapters)
        if (Array.isArray(dbData)) {
          await processDatabaseArray(dbData, dbFile);
        } else {
          console.log(`  ⚠️  Skipping ${dbFile} - not in expected array format`);
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing ${dbFile}:`, error.message);
      }
    }

    // Note: Old chapter files are no longer used - all questions come from database files
    // Database files are processed above, so we skip the old file-based migration
    console.log('\n📝 Note: Using database files only. Old chapter files are skipped.');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Process database files in array format (array of chapters)
async function processDatabaseArray(chapters: any[], sourceFile: string) {
  // First pass: collect all questions and group by their chapter field
  const questionsByChapter = new Map<string, { questions: any[], metadata: any }>();
  
  for (const chapterData of chapters) {
    if (!chapterData.questions || !Array.isArray(chapterData.questions)) {
      console.log(`  ⚠️  Skipping invalid chapter entry`);
      continue;
    }

    // Group questions by their chapter field
    for (const question of chapterData.questions) {
      let chapterTag = question.chapter;
      
      // Convert chapter name format "Chapter 1: Electrical & Electronics" to "chapter-01"
      if (chapterTag && typeof chapterTag === 'string') {
        const chapterMatch = chapterTag.match(/Chapter\s+(\d+)/i);
        if (chapterMatch) {
          const chapterNum = chapterMatch[1].padStart(2, '0');
          chapterTag = `chapter-${chapterNum}`;
          question.chapter = chapterTag; // Update the question's chapter field
        }
      }
      
      // If still no chapter tag, try to derive from chapterData.chapter
      if (!chapterTag) {
        const chapterMatch = chapterData.chapter?.match(/Chapter\s+(\d+)/i);
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
            set: chapterData.set,
            sourceFile,
          },
        });
      }
      
      questionsByChapter.get(finalChapterTag)!.questions.push(question);
    }
  }

  // Load topics.json to get correct topic names
  const topicsPath = join(process.cwd(), 'public', 'data', 'topics.json');
  const topicsData = JSON.parse(await readFile(topicsPath, 'utf-8'));
  const topicsMap = new Map<string, { name: string; description: string; id: string }>(
    topicsData.topics.map((t: any) => [t.id, { name: t.name, description: t.description, id: t.id }])
  );

  // Second pass: create/update topics and migrate questions
  for (const [chapterTag, data] of questionsByChapter.entries()) {
    // Get topic name from topics.json if available, otherwise use metadata
    const topicFromJson = topicsMap.get(chapterTag);
    const topicName = topicFromJson?.name || data.metadata.chapter || `Chapter ${chapterTag}`;
    const topicDescription = topicFromJson?.description || `${topicName}${data.metadata.set ? ` - ${data.metadata.set}` : ''} (from ${data.metadata.sourceFile})`;
    
    await prisma.topic.upsert({
      where: { topicId: chapterTag },
      update: {
        name: topicName,
        description: topicDescription,
        isGeneral: false,
      },
      create: {
        topicId: chapterTag,
        name: topicName,
        description: topicDescription,
        isGeneral: false,
      },
    });

    console.log(`  ✓ Processing ${chapterTag}: ${topicName} (${data.questions.length} questions)`);
    
    // Migrate questions for this chapter
    await migrateQuestions(chapterTag, data.questions, 'database');
  }
}

async function migrateQuestions(
  topicId: string,
  questions: any[],
  type: 'chapter' | 'general' | 'database'
) {
  let count = 0;
  
  for (const q of questions) {
    // Determine question number based on type
    const questionNumber = type === 'database' || type === 'chapter' ? q.id : q.question_number;
    const questionId = type === 'database' || type === 'chapter' ? q.id : q.question_number;

    // Use a unique identifier for upsert
    const uniqueKey = `${topicId}-${questionNumber || questionId || 0}`;

    // Handle chapter field: use from JSON, or derive from topicId if it's a chapter topic
    const chapter = q.chapter || (type === 'database' || (type === 'chapter' && topicId.startsWith('chapter-')) ? topicId : null);
    
    // Handle difficulty field: normalize to 'easy' or 'difficult', or null
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
      await prisma.question.upsert({
        where: {
          topicId_questionNumber: {
            topicId,
            questionNumber: questionNumber || questionId || 0,
          },
        },
        update: {
          question: q.question,
          options: JSON.stringify(q.options),
          correctAnswer: q.correct_answer,
          hint: q.hint || null,
          explanation: q.explanation || null,
          questionType: q.question_type || null,
          marks: q.marks || null,
          source: q.source || null,
          relatedSection: q.related_section || null,
          chapter: chapter || null,
          difficulty: difficulty,
        },
        create: {
          topicId,
          questionNumber: questionNumber || questionId || 0,
          questionId: (type === 'chapter' || type === 'database') ? q.id : null,
          question: q.question,
          options: JSON.stringify(q.options),
          correctAnswer: q.correct_answer,
          hint: q.hint || null,
          explanation: q.explanation || null,
          questionType: q.question_type || null,
          marks: q.marks || null,
          source: q.source || null,
          relatedSection: q.related_section || null,
          chapter: chapter || null,
          difficulty: difficulty,
        },
      });
      count++;
    } catch (error: any) {
      // If unique constraint fails, try to find and update
      if (error.code === 'P2002') {
        const existing = await prisma.question.findFirst({
          where: {
            topicId,
            questionNumber: questionNumber || questionId || 0,
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
              source: q.source || null,
              relatedSection: q.related_section || null,
              chapter: chapter || null,
              difficulty: difficulty,
            },
          });
          count++;
        }
      } else {
        console.error(`Error migrating question ${uniqueKey}:`, error);
      }
    }
  }
  
  console.log(`  ✓ Migrated ${count} questions for ${topicId}`);
}

migrateData();

