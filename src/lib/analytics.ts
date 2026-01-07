import { SessionData, QuestionAttempt, OverallStats, ChapterStats, AnalyticsData, ExamMode } from './types';

const STORAGE_KEY = 'mcq_sessions';

export async function startSession(topic: string, examMode?: ExamMode): Promise<string> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  // Save to localStorage
  const session: SessionData = {
    sessionId,
    topic,
    startTime,
    attempts: [],
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    hintsUsed: 0,
    totalTime: 0,
    examMode: examMode,
  };
  const sessions = getAllSessionsSync();
  sessions.push(session);
  saveSessions(sessions);
  
  return sessionId;
}

export async function recordAttempt(sessionId: string, attempt: QuestionAttempt): Promise<void> {
  // Save to localStorage
  const sessions = getAllSessionsSync();
  const session = sessions.find(s => s.sessionId === sessionId);
  
  if (!session) {
    console.error('Session not found:', sessionId);
    return;
  }
  
  session.attempts.push(attempt);
  session.totalQuestions++;
  session.totalTime += attempt.timeSpent;
  
  if (attempt.correct) {
    session.correctAnswers++;
  } else {
    session.wrongAnswers++;
  }
  
  if (attempt.hintUsed) {
    session.hintsUsed++;
  }
  
  saveSessions(sessions);
}

export async function endSession(sessionId: string): Promise<void> {
  // Update localStorage
  const sessions = getAllSessionsSync();
  const session = sessions.find(s => s.sessionId === sessionId);
  
  if (session) {
    session.endTime = Date.now();
    saveSessions(sessions);
  }
}

export async function getAllSessions(): Promise<SessionData[]> {
  if (typeof window === 'undefined') {
    return [];
  }
  
  // Read from localStorage
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading sessions from localStorage:', error);
    return [];
  }
}

// Synchronous version for backward compatibility (returns empty array, will be populated async)
export function getAllSessionsSync(): SessionData[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading sessions from localStorage:', error);
    return [];
  }
}

export function saveSessions(sessions: SessionData[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving sessions to localStorage:', error);
  }
}

export function calculateOverallStats(sessions: SessionData[]): OverallStats {
  const stats: OverallStats = {
    totalQuestions: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalHints: 0,
    totalTime: 0,
    averageTimePerQuestion: 0,
    accuracy: 0,
  };
  
  sessions.forEach(session => {
    stats.totalQuestions += session.totalQuestions;
    stats.totalCorrect += session.correctAnswers;
    stats.totalWrong += session.wrongAnswers;
    stats.totalHints += session.hintsUsed;
    stats.totalTime += session.totalTime;
  });
  
  if (stats.totalQuestions > 0) {
    stats.averageTimePerQuestion = stats.totalTime / stats.totalQuestions;
    stats.accuracy = (stats.totalCorrect / stats.totalQuestions) * 100;
  }
  
  return stats;
}

export function calculateChapterStats(sessions: SessionData[]): { [topic: string]: ChapterStats } {
  const chapterStats: { [topic: string]: ChapterStats } = {};
  
  sessions.forEach(session => {
    if (!chapterStats[session.topic]) {
      chapterStats[session.topic] = {
        totalQuestions: 0,
        correct: 0,
        wrong: 0,
        hintsUsed: 0,
        averageTime: 0,
        accuracy: 0,
      };
    }
    
    const stats = chapterStats[session.topic];
    stats.totalQuestions += session.totalQuestions;
    stats.correct += session.correctAnswers;
    stats.wrong += session.wrongAnswers;
    stats.hintsUsed += session.hintsUsed;
  });
  
  // Calculate averages and accuracy
  Object.keys(chapterStats).forEach(topic => {
    const stats = chapterStats[topic];
    if (stats.totalQuestions > 0) {
      stats.accuracy = (stats.correct / stats.totalQuestions) * 100;
      
      // Calculate average time for this chapter
      const chapterSessions = sessions.filter(s => s.topic === topic);
      let totalTime = 0;
      chapterSessions.forEach(s => {
        totalTime += s.totalTime;
      });
      stats.averageTime = totalTime / stats.totalQuestions;
    }
  });
  
  return chapterStats;
}

export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const sessions = await getAllSessions();
  return {
    sessions,
    overallStats: calculateOverallStats(sessions),
    chapterStats: calculateChapterStats(sessions),
  };
}

export interface TimeDistribution {
  range: string;
  count: number;
}

export interface PerformanceTrend {
  date: string;
  accuracy: number;
  questions: number;
}

export interface QuestionDifficulty {
  questionId: string;
  topic: string;
  attempts: number;
  correctRate: number;
  averageTime: number;
  hintUsageRate: number;
}

export function getTimeDistribution(sessions: SessionData[]): TimeDistribution[] {
  const distribution: { [key: string]: number } = {
    '0-10s': 0,
    '10-30s': 0,
    '30-60s': 0,
    '1-2m': 0,
    '2m+': 0,
  };

  sessions.forEach(session => {
    session.attempts.forEach(attempt => {
      const seconds = attempt.timeSpent / 1000;
      if (seconds < 10) distribution['0-10s']++;
      else if (seconds < 30) distribution['10-30s']++;
      else if (seconds < 60) distribution['30-60s']++;
      else if (seconds < 120) distribution['1-2m']++;
      else distribution['2m+']++;
    });
  });

  return Object.entries(distribution).map(([range, count]) => ({ range, count }));
}

export function getPerformanceTrends(sessions: SessionData[]): PerformanceTrend[] {
  const trends: { [date: string]: { correct: number; total: number } } = {};

  sessions.forEach(session => {
    const date = new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!trends[date]) {
      trends[date] = { correct: 0, total: 0 };
    }
    trends[date].correct += session.correctAnswers;
    trends[date].total += session.totalQuestions;
  });

  return Object.entries(trends)
    .map(([date, data]) => ({
      date,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
      questions: data.total,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getQuestionDifficulty(sessions: SessionData[]): QuestionDifficulty[] {
  const questionMap: { [key: string]: { attempts: number; correct: number; totalTime: number; hints: number } } = {};

  sessions.forEach(session => {
    session.attempts.forEach(attempt => {
      const key = `${session.topic}-${attempt.questionId}`;
      if (!questionMap[key]) {
        questionMap[key] = { attempts: 0, correct: 0, totalTime: 0, hints: 0 };
      }
      questionMap[key].attempts++;
      if (attempt.correct) questionMap[key].correct++;
      questionMap[key].totalTime += attempt.timeSpent;
      if (attempt.hintUsed) questionMap[key].hints++;
    });
  });

  return Object.entries(questionMap).map(([key, data]) => {
    const [topic, questionId] = key.split('-');
    return {
      questionId,
      topic,
      attempts: data.attempts,
      correctRate: (data.correct / data.attempts) * 100,
      averageTime: data.totalTime / data.attempts,
      hintUsageRate: (data.hints / data.attempts) * 100,
    };
  }).sort((a, b) => b.attempts - a.attempts);
}

export function getBestWorstTopics(sessions: SessionData[]): { best: string; worst: string } {
  const chapterStats = calculateChapterStats(sessions);
  const topics = Object.entries(chapterStats)
    .filter(([_, stats]) => stats.totalQuestions >= 5)
    .sort(([_, a], [__, b]) => b.accuracy - a.accuracy);

  return {
    best: topics[0]?.[0] || '',
    worst: topics[topics.length - 1]?.[0] || '',
  };
}

export function getImprovementRate(sessions: SessionData[]): number {
  if (sessions.length < 2) return 0;

  const sortedSessions = [...sessions].sort((a, b) => a.startTime - b.startTime);
  const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
  const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));

  const firstAccuracy = firstHalf.reduce((acc, s) => {
    const accuracy = s.totalQuestions > 0 ? (s.correctAnswers / s.totalQuestions) * 100 : 0;
    return acc + accuracy;
  }, 0) / firstHalf.length;

  const secondAccuracy = secondHalf.reduce((acc, s) => {
    const accuracy = s.totalQuestions > 0 ? (s.correctAnswers / s.totalQuestions) * 100 : 0;
    return acc + accuracy;
  }, 0) / secondHalf.length;

  return secondAccuracy - firstAccuracy;
}

export interface HintsUsageTrend {
  date: string;
  hints: number;
  questions: number;
  hintRate: number;
}

export interface ChapterComparison {
  name: string;
  accuracy: number;
  questions: number;
  avgTime: number;
}

export interface DailyActivity {
  date: string;
  questions: number;
  sessions: number;
}

export function getHintsUsageTrends(sessions: SessionData[]): HintsUsageTrend[] {
  const trends: { [date: string]: { hints: number; questions: number } } = {};

  sessions.forEach(session => {
    const date = new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!trends[date]) {
      trends[date] = { hints: 0, questions: 0 };
    }
    trends[date].hints += session.hintsUsed;
    trends[date].questions += session.totalQuestions;
  });

  return Object.entries(trends)
    .map(([date, data]) => ({
      date,
      hints: data.hints,
      questions: data.questions,
      hintRate: data.questions > 0 ? (data.hints / data.questions) * 100 : 0,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getChapterComparison(sessions: SessionData[]): ChapterComparison[] {
  const chapterStats = calculateChapterStats(sessions);
  
  return Object.entries(chapterStats)
    .map(([name, stats]) => ({
      name,
      accuracy: stats.accuracy,
      questions: stats.totalQuestions,
      avgTime: stats.averageTime,
    }))
    .filter(ch => ch.questions > 0)
    .sort((a, b) => b.questions - a.questions);
}

export function getDailyActivity(sessions: SessionData[]): DailyActivity[] {
  const activity: { [date: string]: { questions: number; sessions: Set<string> } } = {};

  sessions.forEach(session => {
    const date = new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!activity[date]) {
      activity[date] = { questions: 0, sessions: new Set() };
    }
    activity[date].questions += session.totalQuestions;
    activity[date].sessions.add(session.sessionId);
  });

  return Object.entries(activity)
    .map(([date, data]) => ({
      date,
      questions: data.questions,
      sessions: data.sessions.size,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

