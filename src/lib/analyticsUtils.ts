import { SessionData, ExamMode, OverallStats, ChapterStats } from './types';

/**
 * Filter sessions by mode type
 */
export function filterSessionsByMode(sessions: SessionData[], mode: 'learn' | 'practice'): SessionData[] {
  if (mode === 'learn') {
    return sessions.filter(s => s.topic.startsWith('learn-'));
  }
  return sessions.filter(s => !s.topic.startsWith('learn-'));
}

/**
 * Filter practice sessions by exam mode
 */
export function filterSessionsByExamMode(sessions: SessionData[], examMode: ExamMode): SessionData[] {
  return sessions.filter(s => s.examMode === examMode);
}

/**
 * Calculate stats for a set of sessions
 */
export function calculateStatsForSessions(sessions: SessionData[]): OverallStats {
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

/**
 * Calculate average time per question for chapter stats
 */
export function getAverageTimeForChapter(sessions: SessionData[], topic: string): number {
  const chapterSessions = sessions.filter(s => s.topic.replace('learn-', '') === topic);
  let totalTime = 0;
  let totalQuestions = 0;
  chapterSessions.forEach(s => {
    totalTime += s.totalTime;
    totalQuestions += s.totalQuestions;
  });
  return totalQuestions > 0 ? totalTime / totalQuestions : 0;
}

/**
 * Calculate chapter stats for a set of sessions
 */
export function calculateChapterStatsForSessions(sessions: SessionData[]): { [topic: string]: ChapterStats } {
  const chapterStats: { [topic: string]: ChapterStats } = {};
  
  sessions.forEach(session => {
    const topicKey = session.topic.replace('learn-', '');
    if (!chapterStats[topicKey]) {
      chapterStats[topicKey] = {
        totalQuestions: 0,
        correct: 0,
        wrong: 0,
        hintsUsed: 0,
        averageTime: 0,
        accuracy: 0,
      };
    }
    
    const stats = chapterStats[topicKey];
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
      const chapterSessions = sessions.filter(s => s.topic.replace('learn-', '') === topic);
      let totalTime = 0;
      chapterSessions.forEach(s => {
        totalTime += s.totalTime;
      });
      stats.averageTime = stats.totalQuestions > 0 ? totalTime / stats.totalQuestions : 0;
    }
  });
  
  return chapterStats;
}

/**
 * Get performance insights
 */
export interface PerformanceInsight {
  type: 'strength' | 'weakness' | 'improvement' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  data?: any;
}

export function getPerformanceInsights(
  sessions: SessionData[],
  chapterStats: { [topic: string]: ChapterStats }
): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  
  if (sessions.length === 0) {
    return insights;
  }
  
  // Find strongest and weakest chapters
  const chaptersWithData = Object.entries(chapterStats)
    .filter(([_, stats]) => stats.totalQuestions >= 5)
    .sort(([_, a], [__, b]) => b.accuracy - a.accuracy);
  
  if (chaptersWithData.length > 0) {
    const [bestChapter, bestStats] = chaptersWithData[0];
    const [worstChapter, worstStats] = chaptersWithData[chaptersWithData.length - 1];
    
    if (bestStats.accuracy >= 80) {
      insights.push({
        type: 'strength',
        title: `Strong Performance: ${bestChapter}`,
        description: `You're excelling in ${bestChapter} with ${bestStats.accuracy.toFixed(1)}% accuracy. Keep up the great work!`,
        priority: 'low',
        data: { chapter: bestChapter, accuracy: bestStats.accuracy }
      });
    }
    
    if (worstStats.accuracy < 60 && worstStats.totalQuestions >= 10) {
      insights.push({
        type: 'weakness',
        title: `Needs Focus: ${worstChapter}`,
        description: `${worstChapter} shows ${worstStats.accuracy.toFixed(1)}% accuracy. Consider spending more time reviewing this chapter.`,
        priority: 'high',
        data: { chapter: worstChapter, accuracy: worstStats.accuracy }
      });
    }
  }
  
  // Check for improvement trends
  if (sessions.length >= 5) {
    const sortedSessions = [...sessions].sort((a, b) => a.startTime - b.startTime);
    const recentSessions = sortedSessions.slice(-Math.floor(sessions.length / 2));
    const olderSessions = sortedSessions.slice(0, Math.floor(sessions.length / 2));
    
    const recentAccuracy = recentSessions.reduce((acc, s) => {
      return acc + (s.totalQuestions > 0 ? (s.correctAnswers / s.totalQuestions) * 100 : 0);
    }, 0) / recentSessions.length;
    
    const olderAccuracy = olderSessions.reduce((acc, s) => {
      return acc + (s.totalQuestions > 0 ? (s.correctAnswers / s.totalQuestions) * 100 : 0);
    }, 0) / olderSessions.length;
    
    const improvement = recentAccuracy - olderAccuracy;
    
    if (improvement > 5) {
      insights.push({
        type: 'improvement',
        title: 'Steady Improvement',
        description: `Your accuracy has improved by ${improvement.toFixed(1)}% in recent sessions. Great progress!`,
        priority: 'low',
        data: { improvement }
      });
    } else if (improvement < -5) {
      insights.push({
        type: 'recommendation',
        title: 'Review Needed',
        description: `Your accuracy has decreased by ${Math.abs(improvement).toFixed(1)}%. Consider reviewing previous chapters.`,
        priority: 'high',
        data: { decline: Math.abs(improvement) }
      });
    }
  }
  
  // Check hint usage
  const totalHints = sessions.reduce((acc, s) => acc + s.hintsUsed, 0);
  const totalQuestions = sessions.reduce((acc, s) => acc + s.totalQuestions, 0);
  const hintRate = totalQuestions > 0 ? (totalHints / totalQuestions) * 100 : 0;
  
  if (hintRate > 50) {
    insights.push({
      type: 'recommendation',
      title: 'High Hint Usage',
      description: `You're using hints ${hintRate.toFixed(1)}% of the time. Try to reduce hint dependency to build confidence.`,
      priority: 'medium',
      data: { hintRate }
    });
  }
  
  // Check time per question
  const avgTime = sessions.reduce((acc, s) => {
    return acc + (s.totalQuestions > 0 ? s.totalTime / s.totalQuestions : 0);
  }, 0) / sessions.length;
  
  if (avgTime > 120000) { // More than 2 minutes per question
    insights.push({
      type: 'recommendation',
      title: 'Slow Response Time',
      description: `Average time per question is ${(avgTime / 1000 / 60).toFixed(1)} minutes. Practice more to improve speed.`,
      priority: 'medium',
      data: { avgTime }
    });
  }
  
  // Find chapters with low attempt count
  const lowAttemptChapters = Object.entries(chapterStats)
    .filter(([_, stats]) => stats.totalQuestions < 10 && stats.totalQuestions > 0)
    .sort(([_, a], [__, b]) => a.totalQuestions - b.totalQuestions);
  
  if (lowAttemptChapters.length > 0) {
    const [chapter] = lowAttemptChapters[0];
    insights.push({
      type: 'recommendation',
      title: `Explore More: ${chapter}`,
      description: `You've only attempted ${chapterStats[chapter].totalQuestions} questions in ${chapter}. Try practicing more questions here.`,
      priority: 'medium',
      data: { chapter, count: chapterStats[chapter].totalQuestions }
    });
  }
  
  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Get mode-specific insights
 */
export function getModeSpecificInsights(
  sessions: SessionData[],
  mode: 'learn' | 'practice',
  examMode?: ExamMode
): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  const filteredSessions = examMode 
    ? sessions.filter(s => s.examMode === examMode)
    : sessions;
  
  if (filteredSessions.length === 0) {
    return insights;
  }
  
  const stats = calculateStatsForSessions(filteredSessions);
  
  if (mode === 'learn') {
    // Learn mode specific insights
    if (stats.accuracy >= 85) {
      insights.push({
        type: 'strength',
        title: 'Excellent Learning Progress',
        description: `You're mastering the concepts with ${stats.accuracy.toFixed(1)}% accuracy in learn mode.`,
        priority: 'low',
      });
    }
    
    // Check if user is reviewing explanations
    const sessionsWithExplanations = filteredSessions.filter(s => 
      s.attempts.some(a => a.explanationViewed)
    );
    const explanationRate = filteredSessions.length > 0 
      ? (sessionsWithExplanations.length / filteredSessions.length) * 100 
      : 0;
    
    if (explanationRate < 80) {
      insights.push({
        type: 'recommendation',
        title: 'Review Explanations',
        description: 'Make sure to read explanations after each question in learn mode to maximize understanding.',
        priority: 'medium',
      });
    }
  } else {
    // Practice mode specific insights
    if (examMode === 'quick-test') {
      if (stats.accuracy >= 80) {
        insights.push({
          type: 'strength',
          title: 'Quick Test Mastery',
          description: `You're performing well in quick tests with ${stats.accuracy.toFixed(1)}% accuracy. Ready for full tests!`,
          priority: 'low',
        });
      } else if (stats.accuracy < 60) {
        insights.push({
          type: 'recommendation',
          title: 'Build Foundation First',
          description: `Quick test accuracy is ${stats.accuracy.toFixed(1)}%. Focus on chapter practice before attempting full tests.`,
          priority: 'high',
        });
      }
    } else if (examMode === 'full-test') {
      if (stats.accuracy >= 70) {
        insights.push({
          type: 'strength',
          title: 'Exam Ready',
          description: `You're scoring ${stats.accuracy.toFixed(1)}% in full tests. You're well-prepared for the actual exam!`,
          priority: 'low',
        });
      } else {
        insights.push({
          type: 'recommendation',
          title: 'More Practice Needed',
          description: `Full test accuracy is ${stats.accuracy.toFixed(1)}%. Continue practicing to reach 70%+ for exam readiness.`,
          priority: 'high',
        });
      }
    } else if (examMode === 'chapterwise') {
      if (stats.accuracy >= 75) {
        insights.push({
          type: 'strength',
          title: 'Strong Chapter Practice',
          description: `You're doing well in chapter practice with ${stats.accuracy.toFixed(1)}% accuracy.`,
          priority: 'low',
        });
      }
    }
  }
  
  return insights;
}

/**
 * Get focus recommendations
 */
export interface FocusRecommendation {
  chapter: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  currentAccuracy: number;
  targetAccuracy: number;
  questionsNeeded: number;
}

export function getFocusRecommendations(
  chapterStats: { [topic: string]: ChapterStats }
): FocusRecommendation[] {
  const recommendations: FocusRecommendation[] = [];
  
  Object.entries(chapterStats).forEach(([chapter, stats]) => {
    if (stats.totalQuestions < 5) {
      recommendations.push({
        chapter,
        reason: 'Insufficient practice',
        priority: 'high',
        currentAccuracy: stats.accuracy,
        targetAccuracy: 70,
        questionsNeeded: 20 - stats.totalQuestions,
      });
    } else if (stats.accuracy < 60 && stats.totalQuestions >= 5) {
      recommendations.push({
        chapter,
        reason: 'Low accuracy',
        priority: 'high',
        currentAccuracy: stats.accuracy,
        targetAccuracy: 70,
        questionsNeeded: Math.max(15, Math.ceil((70 - stats.accuracy) / 2) * 5),
      });
    } else if (stats.accuracy >= 60 && stats.accuracy < 75) {
      recommendations.push({
        chapter,
        reason: 'Can improve further',
        priority: 'medium',
        currentAccuracy: stats.accuracy,
        targetAccuracy: 80,
        questionsNeeded: Math.ceil((80 - stats.accuracy) / 2) * 5,
      });
    }
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

