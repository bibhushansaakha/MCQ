'use server';

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { Question, Topic } from './types';

// Cache for loaded data
let topicsCache: Topic[] | null = null;
let questionsCache: Map<string, Question[]> = new Map();

/**
 * Read topics from topics.json
 */
export async function loadTopicsFromJson(): Promise<Topic[]> {
  if (topicsCache) {
    return topicsCache;
  }

  try {
    const topicsPath = join(process.cwd(), 'public', 'data', 'topics.json');
    const topicsData = JSON.parse(await readFile(topicsPath, 'utf-8'));
    
    // Handle both { topics: [...] } and [...] formats
    const topicsArray = Array.isArray(topicsData) ? topicsData : (topicsData.topics || []);
    
    const topics: Topic[] = topicsArray.map((topic: any) => ({
      id: topic.id,
      name: topic.name,
      file: '',
      description: topic.description || '',
      isGeneral: topic.isGeneral || false,
    }));

    // Filter to only chapters 1-10 and sort numerically
    const filtered = topics
      .filter(topic => {
        if (!topic.id.startsWith('chapter-')) return true; // Keep non-chapter topics
        const match = topic.id.match(/chapter-(\d+)/);
        if (!match) return true;
        const chapterNum = parseInt(match[1], 10);
        return chapterNum >= 1 && chapterNum <= 10;
      })
      .sort((a, b) => {
        const aMatch = a.id.match(/chapter-(\d+)/);
        const bMatch = b.id.match(/chapter-(\d+)/);
        
        if (aMatch && bMatch) {
          return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
        }
        
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        
        return a.id.localeCompare(b.id);
      });

    topicsCache = filtered;
    return filtered;
  } catch (error) {
    console.error('Error loading topics from JSON:', error);
    return [];
  }
}

/**
 * Load all questions from JSON files
 */
export async function loadAllQuestionsFromJson(): Promise<Question[]> {
  try {
    const dataDir = join(process.cwd(), 'public', 'data');
    const files = await readdir(dataDir);
    const jsonFiles = files.filter(file => 
      file.endsWith('.json') && 
      file !== 'topics.json' &&
      file.startsWith('NEC_')
    ).sort();

    const allQuestions: Question[] = [];

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
          // Extract topicId from chapter
          let topicId: string | null = null;
          
          if (q.chapter) {
            const numMatch = String(q.chapter).match(/(\d+)/);
            if (numMatch) {
              topicId = `chapter-${numMatch[1].padStart(2, '0')}`;
            }
          }
          
          if (!topicId && chapterName) {
            const numMatch = chapterName.match(/(\d+)/);
            if (numMatch) {
              topicId = `chapter-${numMatch[1].padStart(2, '0')}`;
            }
          }

          if (!topicId) continue;

          // Handle options - could be array or JSON string
          let options: string[] = [];
          if (Array.isArray(q.options)) {
            options = q.options;
          } else if (typeof q.options === 'string') {
            try {
              options = JSON.parse(q.options);
            } catch {
              options = [];
            }
          }

          const question: Question = {
            question_number: q.question_number || q.id || q.questionNumber || 0,
            id: q.id || q.question_number || q.questionNumber || undefined,
            question: q.question,
            options: options,
            correct_answer: q.correct_answer || q.correctAnswer,
            hint: q.hint || '',
            explanation: q.explanation || '',
            chapter: q.chapter || chapterName,
            difficulty: (q.difficulty === 'easy' || q.difficulty === 'difficult') ? q.difficulty : undefined,
            source: q.source || file,
          };

          allQuestions.push(question);
        }
      }
    }

    return allQuestions;
  } catch (error) {
    console.error('Error loading questions from JSON:', error);
    return [];
  }
}

/**
 * Load questions for a specific topicId
 */
export async function loadQuestionsForTopic(topicId: string): Promise<Question[]> {
  // Check cache first
  if (questionsCache.has(topicId)) {
    return questionsCache.get(topicId)!;
  }

  const allQuestions = await loadAllQuestionsFromJson();
  
  // Filter by topicId (extract chapter number from topicId)
  const chapterMatch = topicId.match(/chapter-(\d+)/);
  if (!chapterMatch) {
    return [];
  }

  const chapterNum = parseInt(chapterMatch[1], 10);
  
  const filtered = allQuestions.filter(q => {
    if (!q.chapter) return false;
    const qChapterMatch = String(q.chapter).match(/(\d+)/);
    if (!qChapterMatch) return false;
    const qChapterNum = parseInt(qChapterMatch[1], 10);
    return qChapterNum === chapterNum;
  });

  questionsCache.set(topicId, filtered);
  return filtered;
}

/**
 * Extract metadata from questions
 */
export async function extractMetadata(): Promise<{
  chapters: string[];
  difficulties: ('easy' | 'difficult')[];
  sources: string[];
}> {
  const questions = await loadAllQuestionsFromJson();
  
  const chapters = new Set<string>();
  const difficulties = new Set<'easy' | 'difficult'>();
  const sources = new Set<string>();

  for (const q of questions) {
    if (q.chapter) {
      const match = String(q.chapter).match(/(\d+)/);
      if (match) {
        chapters.add(`chapter-${match[1].padStart(2, '0')}`);
      }
    }
    if (q.difficulty) {
      difficulties.add(q.difficulty);
    }
    if (q.source) {
      sources.add(q.source);
    }
  }

  return {
    chapters: Array.from(chapters).sort(),
    difficulties: Array.from(difficulties).sort() as ('easy' | 'difficult')[],
    sources: Array.from(sources).sort(),
  };
}

/**
 * Get question counts per topic
 */
export async function getTopicStats(): Promise<Record<string, number>> {
  const questions = await loadAllQuestionsFromJson();
  const stats: Record<string, number> = {};

  for (const q of questions) {
    if (!q.chapter) continue;
    const match = String(q.chapter).match(/(\d+)/);
    if (!match) continue;
    const topicId = `chapter-${match[1].padStart(2, '0')}`;
    stats[topicId] = (stats[topicId] || 0) + 1;
  }

  return stats;
}

