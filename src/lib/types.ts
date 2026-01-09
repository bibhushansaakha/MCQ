export interface Question {
  question_number?: number;
  id?: number;
  question: string;
  options: string[];
  correct_answer: string;
  hint: string;
  explanation: string;
  chapter?: string;
  difficulty?: 'easy' | 'difficult';
  source?: string;
}

export interface QuestionData {
  section?: string;
  chapter?: string;
  chapter_code?: string;
  questions: Question[];
}

export interface ChapterQuestionData {
  chapter: string;
  chapter_code: string;
  total_questions: number;
  questions: Array<{
    id: number;
    question_type: string;
    marks: number;
    question: string;
    options: string[];
    correct_answer: string;
    hint: string;
    explanation: string;
    source?: string;
    related_section?: string;
    chapter?: string;
    difficulty?: 'easy' | 'difficult';
  }>;
}

export interface Topic {
  id: string;
  name: string;
  file: string;
  description: string;
  isGeneral?: boolean;
}

export interface TopicsData {
  topics: Topic[];
}

export interface QuestionAttempt {
  questionId: string;
  topic: string;
  correct: boolean;
  timeSpent: number; // milliseconds
  hintUsed: boolean;
  explanationViewed: boolean;
  timestamp: number;
  selectedOption?: string; // Store the selected option for review
}

export type ExamMode = 'chapterwise' | 'quick-test' | 'full-test' | 'official-quick-test' | 'official-full-test' | 'official-random' | 'past-quick-test' | 'past-full-test' | 'past-random';

export interface SessionData {
  sessionId: string;
  topic: string;
  startTime: number;
  endTime?: number;
  attempts: QuestionAttempt[];
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  hintsUsed: number;
  totalTime: number;
  examMode?: ExamMode;
  questions?: (Question | QuestionWithChapter)[]; // Store exact questions for exam modes
}

export interface OverallStats {
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalHints: number;
  totalTime: number;
  averageTimePerQuestion: number;
  accuracy: number; // percentage
}

export interface ChapterStats {
  totalQuestions: number;
  correct: number;
  wrong: number;
  hintsUsed: number;
  averageTime: number;
  accuracy: number;
}

export interface AnalyticsData {
  sessions: SessionData[];
  overallStats: OverallStats;
  chapterStats: {
    [topic: string]: ChapterStats;
  };
}

export interface QuestionWithChapter extends Question {
  chapterId?: string;
}

export const EXAM_CONFIG = {
  'quick-test': {
    questionCount: 25,
    timeLimit: 30 * 60 * 1000, // 30 minutes in milliseconds
  },
  'full-test': {
    questionCount: 100,
    timeLimit: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  },
  'official-quick-test': {
    questionCount: 25,
    timeLimit: 30 * 60 * 1000, // 30 minutes in milliseconds
  },
  'official-full-test': {
    questionCount: 100,
    timeLimit: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  },
  'past-quick-test': {
    questionCount: 25,
    timeLimit: 30 * 60 * 1000, // 30 minutes in milliseconds
  },
  'past-full-test': {
    questionCount: 100,
    timeLimit: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  },
  'official-random': {
    questionCount: 50,
    timeLimit: 60 * 60 * 1000, // 1 hour in milliseconds
  },
  'past-random': {
    questionCount: 50,
    timeLimit: 60 * 60 * 1000, // 1 hour in milliseconds
  },
} as const;

