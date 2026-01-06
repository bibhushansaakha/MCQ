import { Question, QuestionData, Topic, TopicsData, ChapterQuestionData } from './types';

// Client-side fetch
async function fetchJsonFile<T>(filePath: string): Promise<T> {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath}`);
  }
  return response.json();
}

function normalizeQuestions(data: QuestionData | ChapterQuestionData): Question[] {
  if ('questions' in data && Array.isArray(data.questions)) {
    return data.questions.map((q: any) => ({
      question_number: q.question_number || q.id || 0,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      hint: q.hint,
      explanation: q.explanation,
    }));
  }
  return [];
}

export async function loadQuestions(topicId: string): Promise<Question[]> {
  try {
    const topicsData: TopicsData = await fetchJsonFile<TopicsData>('/data/topics.json');
    
    const topic = topicsData.topics.find(t => t.id === topicId);
    if (!topic) {
      throw new Error(`Topic ${topicId} not found`);
    }

    // Handle general test - combine SETI and SETII sections
    if (topic.isGeneral) {
      const setiA: QuestionData = await fetchJsonFile<QuestionData>('/data/seti-section-a.json');
      const setiB: QuestionData = await fetchJsonFile<QuestionData>('/data/seti-section-b.json');
      const setiiA: QuestionData = await fetchJsonFile<QuestionData>('/data/setii-section-a.json');
      
      const allQuestions = [
        ...normalizeQuestions(setiA),
        ...normalizeQuestions(setiB),
        ...normalizeQuestions(setiiA),
      ];
      
      return allQuestions;
    }

    const data = await fetchJsonFile<QuestionData | ChapterQuestionData>(topic.file);
    return normalizeQuestions(data);
  } catch (error) {
    console.error('Error loading questions:', error);
    throw error;
  }
}

export async function loadTopics(): Promise<Topic[]> {
  try {
    const data: TopicsData = await fetchJsonFile<TopicsData>('/data/topics.json');
    return data.topics;
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

