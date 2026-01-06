export interface Question {
  question_number?: number;
  id?: number;
  question: string;
  options: string[];
  correct_answer: string;
  hint: string;
  explanation: string;
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
}

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

