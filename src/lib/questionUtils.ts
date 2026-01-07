import { Question, Topic, QuestionWithChapter } from './types';

// Client-side API calls
export async function loadQuestions(topicId: string, filters?: {
  chapters?: string[];
  difficulties?: ('easy' | 'difficult')[];
  sources?: string[];
}): Promise<Question[]> {
  try {
    // If filters are provided, use filter endpoint
    if (filters && (filters.chapters?.length || filters.difficulties?.length || filters.sources?.length)) {
      const response = await fetch('/api/questions/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          ...filters,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to load filtered questions');
      }
      return response.json();
    }
    
    // Otherwise use regular endpoint - just query by topicId
    const response = await fetch(`/api/questions/${topicId}`);
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

