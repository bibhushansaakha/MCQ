'use server';

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { Question, Topic } from './types';

// Cache for loaded data
let topicsCache: Topic[] | null = null;
let questionsCache: Map<string, Question[]> = new Map();
let learnQuestionsCache: Map<string, Question[]> = new Map();

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
 * Load learn questions from learn/{chapter}.json
 * Handles both single files (1.json) and split files (5_1.json, 5_2.json)
 */
export async function loadLearnQuestions(chapter: number): Promise<Question[]> {
  // Check cache first
  const cacheKey = `learn-${chapter}`;
  if (learnQuestionsCache.has(cacheKey)) {
    return learnQuestionsCache.get(cacheKey)!;
  }

  try {
    const learnDir = join(process.cwd(), 'public', 'data', 'learn');
    const allQuestions: Question[] = [];
    
    // Check for split files first (e.g., 5_1.json, 5_2.json)
    const files = await readdir(learnDir);
    const chapterFiles = files.filter(file => {
      if (!file.endsWith('.json')) return false;
      // Match exact chapter number or chapter with underscore (e.g., 5_1.json, 5_2.json)
      const match = file.match(/^(\d+)(?:_\d+)?\.json$/);
      return match && parseInt(match[1], 10) === chapter;
    }).sort(); // Sort to ensure order (5_1.json before 5_2.json)

    if (chapterFiles.length === 0) {
      console.error(`No learn files found for chapter ${chapter}`);
      return [];
    }

    // Load all matching files
    for (const file of chapterFiles) {
      try {
        const filePath = join(learnDir, file);
        let content = await readFile(filePath, 'utf-8');
        
        // Try to parse JSON first - only repair if needed
        let data;
        try {
          // First try parsing directly
          data = JSON.parse(content);
        } catch (directParseError: any) {
          // If direct parse fails, try repairing
          
          // Replace curly quotes first (before JSON parsing)
          let repairedContent = content.replace(/\u201C/g, '"'); // Left double quotation mark
          repairedContent = repairedContent.replace(/\u201D/g, '"'); // Right double quotation mark
          repairedContent = repairedContent.replace(/\u2018/g, "'"); // Left single quotation mark
          repairedContent = repairedContent.replace(/\u2019/g, "'"); // Right single quotation mark
          repairedContent = repairedContent.replace(/[\u2014\u2013]/g, '-'); // Em/en dash
          
          // Fix unescaped quotes inside string values using a proper JSON state machine
          let result = '';
          let i = 0;
          let inString = false;
          let escapeNext = false;
          
          while (i < repairedContent.length) {
            const char = repairedContent[i];
            
            if (escapeNext) {
              // We're processing an escaped character
              result += char;
              escapeNext = false;
              i++;
              continue;
            }
            
            if (char === '\\') {
              // Escape sequence - preserve it and mark next char as escaped
              result += char;
              escapeNext = true;
              i++;
              continue;
            }
            
            if (char === '"') {
              if (inString) {
                // We're inside a string - check if this quote ends the string
                // Look ahead to see if this is followed by structural characters
                const lookAhead = repairedContent.substring(i + 1, Math.min(i + 15, repairedContent.length));
                // End quote if followed by: colon (key), comma, closing brace, or closing bracket
                const isEndQuote = /^\s*([:,}\]])/.test(lookAhead);
                
                if (isEndQuote) {
                  // This quote ends the string
                  result += char;
                  inString = false;
                } else {
                  // This quote is inside the string value - escape it
                  result += '\\"';
                }
              } else {
                // We're not in a string - this quote starts a string (key or value)
                // The only exception is if it's immediately followed by closing bracket/brace (empty array/object)
                const lookAhead = repairedContent.substring(i + 1, Math.min(i + 10, repairedContent.length));
                
                // Only structural if immediately followed by closing bracket/brace (empty array/object like [] or {})
                const isStructural = /^\s*[\]}]/.test(lookAhead);
                
                if (isStructural) {
                  // Structural quote (empty array/object) - don't enter string mode
                  result += char;
                } else {
                  // This starts a string value (key or value)
                  result += char;
                  inString = true;
                }
              }
            } else {
              // Handle other characters
              if (inString && (char === '\n' || char === '\r')) {
                // Escape newlines inside string values
                if (char === '\n') {
                  result += '\\n';
                } else if (char === '\r') {
                  result += '\\r';
                }
              } else {
                result += char;
              }
            }
            
            i++;
          }
          
          // Try parsing the repaired content
          try {
            data = JSON.parse(result);
          } catch (parseError: any) {
            const errorPos = parseError.message.match(/position (\d+)/)?.[1];
            const contextStart = Math.max(0, parseInt(errorPos || '0', 10) - 100);
            const contextEnd = Math.min(result.length, parseInt(errorPos || '0', 10) + 100);
            const context = result.substring(contextStart, contextEnd);
            
            console.error(`Error parsing JSON in ${file} at position ${errorPos}:`, parseError.message);
            console.error(`Context: ${JSON.stringify(context)}`);
            throw new Error(`Invalid JSON in ${file} at position ${errorPos}: ${parseError.message}`);
          }
        }

        // Handle two possible formats:
        // 1. Array of chapter objects: [{ chapter: "...", questions: [...] }]
        // 2. Direct array of questions: [{ id: 1, question: "...", ... }]
        let questionsToProcess: any[] = [];
        let chapterName = '';
        let source = `learn-${chapter}`;

        if (Array.isArray(data)) {
          // Check if it's format 1 (chapter objects) or format 2 (direct questions)
          if (data.length > 0 && data[0].questions !== undefined) {
            // Format 1: Array of chapter objects
            for (const chapterData of data) {
              const chapterQuestions = chapterData.questions || [];
              if (Array.isArray(chapterQuestions)) {
                chapterName = chapterData.chapter || chapterData.chapterName || chapterName;
                source = chapterData.source || source;
                questionsToProcess.push(...chapterQuestions);
              }
            }
          } else {
            // Format 2: Direct array of questions
            // Filter out any non-question objects (like metadata)
            questionsToProcess = data.filter(item => 
              item && (item.question !== undefined || item.id !== undefined || item.question_number !== undefined)
            );
            // Try to get chapter name from first question if available
            if (questionsToProcess.length > 0 && questionsToProcess[0].chapter) {
              chapterName = questionsToProcess[0].chapter;
            }
          }
        } else {
          // Single object - check if it has questions property
          if (data.questions) {
            questionsToProcess = Array.isArray(data.questions) ? data.questions : [];
            chapterName = data.chapter || data.chapterName || '';
            source = data.source || source;
          } else {
            // Single question object
            questionsToProcess = [data];
          }
        }

        // Process all questions
        for (const q of questionsToProcess) {
          // Skip if question is missing required fields
          if (!q || (!q.question && !q.id && !q.question_number)) {
            continue;
          }

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

          // Validate required fields
          if (!q.question || options.length === 0 || !q.correct_answer) {
            console.error(`Skipping question in ${file} due to missing required fields:`, {
              hasQuestion: !!q.question,
              optionsCount: options.length,
              hasCorrectAnswer: !!q.correct_answer,
            });
            continue;
          }

          const question: Question = {
            question_number: q.id || q.question_number || q.questionNumber || 0,
            id: q.id || q.question_number || q.questionNumber || undefined,
            question: q.question.trim(),
            options: options.map(opt => typeof opt === 'string' ? opt.trim() : String(opt)),
            correct_answer: (q.correct_answer || q.correctAnswer || '').trim(),
            hint: (q.hint || '').trim(),
            explanation: (q.explanation || '').trim(),
            chapter: (q.chapter || chapterName || '').trim(),
            difficulty: (q.difficulty === 'easy' || q.difficulty === 'difficult') ? q.difficulty : undefined,
            source: (q.source || source || '').trim(),
          };

          allQuestions.push(question);
        }
      } catch (fileError: any) {
        const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
        console.error(`Error loading learn file ${file} for chapter ${chapter}:`, errorMessage);
        // Continue with other files even if one fails, but log the error
        // This allows partial loading if some files succeed
      }
    }

    // Sort by id/question_number to maintain order
    const sortedQuestions = allQuestions.sort((a, b) => 
      (a.id || a.question_number || 0) - (b.id || b.question_number || 0)
    );

    learnQuestionsCache.set(cacheKey, sortedQuestions);
    return sortedQuestions;
  } catch (error) {
    console.error(`Error loading learn questions for chapter ${chapter}:`, error);
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
