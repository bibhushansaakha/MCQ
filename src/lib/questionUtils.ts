import { Question, Topic, QuestionWithChapter } from './types';

// Client-side API calls
export async function loadQuestions(topicId: string, filters?: {
  chapters?: string[];
  difficulties?: ('easy' | 'difficult')[];
  sources?: string[];
}): Promise<Question[]> {
  try {
    // For chapter topics, automatically filter by chapter matching the topicId
    const isChapterTopic = topicId.startsWith('chapter-');
    const effectiveFilters = { ...filters };
    
    if (isChapterTopic) {
      // If no explicit chapter filter, use the topicId as the chapter filter
      if (!effectiveFilters.chapters || effectiveFilters.chapters.length === 0) {
        effectiveFilters.chapters = [topicId];
      }
    }
    
    // If filters are provided, use filter endpoint
    if (effectiveFilters && (effectiveFilters.chapters?.length || effectiveFilters.difficulties?.length || effectiveFilters.sources?.length)) {
      const response = await fetch('/api/questions/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          ...effectiveFilters,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to load filtered questions');
      }
      return response.json();
    }
    
    // Otherwise use regular endpoint (with chapter filter in URL if chapter topic)
    const url = isChapterTopic 
      ? `/api/questions/${topicId}?chapters=${encodeURIComponent(topicId)}`
      : `/api/questions/${topicId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load questions for ${topicId}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error loading questions:', error);
    throw error;
  }
}

export async function loadQuestionsFromAllChapters(count: number): Promise<QuestionWithChapter[]> {
  try {
    const response = await fetch(`/api/questions/all-chapters?count=${count}`);
    if (!response.ok) {
      throw new Error('Failed to load questions from all chapters');
    }
    return response.json();
  } catch (error) {
    console.error('Error loading questions from all chapters:', error);
    throw error;
  }
}

export async function loadTopics(): Promise<Topic[]> {
  try {
    const response = await fetch('/api/topics');
    if (!response.ok) {
      throw new Error('Failed to load topics');
    }
    return response.json();
  } catch (error) {
    console.error('Error loading topics:', error);
    throw error;
  }
}

export function shuffleQuestions<T>(questions: T[]): T[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getNextQuestion<T>(
  questions: T[],
  shownSet: Set<number>
): T | null {
  const availableIndices = questions
    .map((_, index) => index)
    .filter(index => !shownSet.has(index));
  
  if (availableIndices.length === 0) {
    return null; // All questions shown
  }
  
  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  return questions[randomIndex];
}

