'use client';

import { useEffect, useState } from 'react';
import { getAllSessions } from '@/lib/analytics';
import { SessionData, QuestionAttempt, Question } from '@/lib/types';
import { loadQuestions } from '@/lib/questionUtils';
import { formatTime } from '@/lib/analytics';
import ThemeToggleWrapper from '@/components/ThemeToggleWrapper';
import Link from 'next/link';

interface HistoryItem {
  attempt: QuestionAttempt;
  question: Question | null;
  sessionTopic: string;
  sessionDate: string;
}

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        const allSessions = await getAllSessions();
        setSessions(allSessions);
        const items: HistoryItem[] = [];

        // Collect all attempts with their session info
        for (const session of allSessions) {
          const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          // Try to load questions for this topic
          let questions: Question[] = [];
          try {
            questions = await loadQuestions(session.topic);
          } catch (error) {
            console.error(`Error loading questions for topic ${session.topic}:`, error);
          }

          // Create a map of question IDs to questions
          const questionMap = new Map<string, Question>();
          questions.forEach((q, idx) => {
            // Try multiple ID formats to match
            const qId1 = q.id?.toString();
            const qId2 = q.question_number?.toString();
            const qId3 = idx.toString();
            if (qId1) questionMap.set(qId1, q);
            if (qId2) questionMap.set(qId2, q);
            if (qId3) questionMap.set(qId3, q);
            // Also try with leading zeros or different formats
            if (qId1) questionMap.set(qId1.padStart(2, '0'), q);
            if (qId2) questionMap.set(qId2.padStart(2, '0'), q);
          });

          // Add each attempt
          for (const attempt of session.attempts) {
            const question = questionMap.get(attempt.questionId) || null;
            items.push({
              attempt,
              question,
              sessionTopic: session.topic,
              sessionDate,
            });
          }
        }

        // Sort by timestamp (newest first)
        items.sort((a, b) => b.attempt.timestamp - a.attempt.timestamp);
        setHistoryItems(items);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index.toString())) {
      newExpanded.delete(index.toString());
    } else {
      newExpanded.add(index.toString());
    }
    setExpandedItems(newExpanded);
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to delete all test results and history? This action cannot be undone.')) {
      return;
    }

    setClearing(true);
    try {
      // Clear database
      const response = await fetch('/api/clear-history', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mcq_sessions');
      }

      // Reload history
      setHistoryItems([]);
      setSessions([]);
      
      // Reload the page to refresh everything
      window.location.reload();
    } catch (error) {
      console.error('Error clearing history:', error);
      alert('Failed to clear history. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this test result? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      // Remove from state
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      setHistoryItems(prev => prev.filter(item => {
        // Find the session to get its attempts
        const session = sessions.find(s => s.sessionId === sessionId);
        if (!session) return true;
        const attemptIds = new Set(session.attempts.map(a => `${a.questionId}-${a.timestamp}`));
        return !attemptIds.has(`${item.attempt.questionId}-${item.attempt.timestamp}`);
      }));

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mcq_sessions');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  const handleDeleteAttempt = async (attempt: QuestionAttempt, sessionTopic: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this question attempt? This action cannot be undone.')) {
      return;
    }

    try {
      // Find the session this attempt belongs to
      const session = sessions.find(s => 
        s.topic === sessionTopic && 
        s.attempts.some(a => 
          a.questionId === attempt.questionId && 
          a.timestamp === attempt.timestamp
        )
      );

      if (session) {
        // Delete attempt via API
        const response = await fetch(`/api/attempts/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            questionId: attempt.questionId,
            timestamp: attempt.timestamp,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete attempt');
        }

        // Remove from UI
        setHistoryItems(prev => prev.filter(item => 
          !(item.attempt.questionId === attempt.questionId && 
            item.attempt.timestamp === attempt.timestamp &&
            item.sessionTopic === sessionTopic)
        ));

        // Update sessions state
        setSessions(prev => prev.map(s => {
          if (s.sessionId === session.sessionId) {
            return {
              ...s,
              attempts: s.attempts.filter(a => 
                !(a.questionId === attempt.questionId && a.timestamp === attempt.timestamp)
              ),
            };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error('Error deleting attempt:', error);
      alert('Failed to delete attempt. Please try again.');
    }
  };

  const filteredItems = selectedTopic === 'all'
    ? historyItems
    : historyItems.filter(item => item.sessionTopic === selectedTopic);

  const topics = Array.from(new Set(historyItems.map(item => item.sessionTopic))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-800 border-t-foreground mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex justify-between items-center pb-6">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-1">
              Attempts
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Review all questions you&apos;ve attempted
            </p>
          </div>
          <button
            onClick={handleClearHistory}
            disabled={clearing || (sessions.length === 0 && historyItems.length === 0)}
            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearing ? 'Clearing...' : 'Clear History'}
          </button>
        </div>

        {/* Exam Sessions */}
        {sessions.filter(s => s.examMode === 'quick-test' || s.examMode === 'full-test').length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Exam Sessions</h2>
            <div className="space-y-3">
              {sessions
                .filter(s => s.examMode === 'quick-test' || s.examMode === 'full-test')
                .sort((a, b) => b.startTime - a.startTime)
                .map(session => {
                  const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const attempts = session.attempts || [];
                  const totalQuestions = attempts.length;
                  const correctAnswers = attempts.filter((a: QuestionAttempt) => a.correct).length;
                  const wrongAnswers = attempts.filter((a: QuestionAttempt) => !a.correct).length;
                  const accuracy = totalQuestions > 0 
                    ? ((correctAnswers / totalQuestions) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <div
                      key={session.sessionId}
                      className="p-4 rounded-lg border border-gray-200/40 dark:border-gray-700/30"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-transparent">
                              {session.examMode === 'quick-test' ? 'Quick Test' : 'Full Test'}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-500">
                              {sessionDate}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-500">Questions: </span>
                              <span className="font-semibold text-foreground">{totalQuestions}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-500">Correct: </span>
                              <span className="font-semibold text-green-600 dark:text-green-400">{correctAnswers}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-500">Incorrect: </span>
                              <span className="font-semibold text-red-600 dark:text-red-400">{wrongAnswers}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-500">Accuracy: </span>
                              <span className="font-semibold text-foreground">{accuracy}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Link
                            href={`/review/${session.sessionId}`}
                            className="px-4 py-2 text-sm font-medium text-background bg-foreground rounded hover:bg-foreground/90"
                          >
                            Review
                          </Link>
                          <button
                            onClick={(e) => handleDeleteSession(session.sessionId, e)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-foreground rounded transition-colors"
                            title="Delete this test result"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Filter */}
        {topics.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`px-3 py-1.5 text-sm rounded border ${
                selectedTopic === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-foreground border-gray-200/40 dark:border-gray-700/30 hover:bg-gray-50/15 dark:hover:bg-gray-800/10'
              }`}
            >
              All Topics
            </button>
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1.5 text-sm rounded border ${
                  selectedTopic === topic
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-transparent text-foreground border-gray-200/40 dark:border-gray-700/30 hover:bg-gray-50/15 dark:hover:bg-gray-800/10'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* History Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              No questions attempted yet. Start practicing to see your history!
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 text-sm text-foreground bg-transparent border border-gray-200/40 dark:border-gray-700/30 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10"
            >
              Start Practicing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, index) => {
              const isExpanded = expandedItems.has(index.toString());
              const { attempt, question, sessionTopic, sessionDate } = item;
              
              return (
                <div
                  key={`${attempt.timestamp}-${index}`}
                  className="rounded border border-gray-200/40 dark:border-gray-700/30 overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50/15 dark:hover:bg-gray-800/10"
                    onClick={() => toggleExpand(index)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold border ${
                              attempt.correct
                                ? 'border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 bg-transparent'
                                : 'border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 bg-transparent'
                            }`}
                          >
                            {attempt.correct ? (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {sessionTopic} • {sessionDate}
                          </span>
                          {attempt.hintUsed && (
                            <span className="text-xs px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 bg-transparent">
                              Hint Used
                            </span>
                          )}
                        </div>
                        {question ? (
                          <p className="text-sm font-medium text-foreground line-clamp-2">
                            {question.question}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            Question ID: {attempt.questionId} (Question data not available)
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                          <span>Time: {formatTime(attempt.timeSpent)}</span>
                          {attempt.explanationViewed && (
                            <span>Explanation viewed</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={(e) => handleDeleteAttempt(attempt, sessionTopic, e)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-foreground rounded transition-colors"
                          title="Delete this question attempt"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <button className="text-gray-400 dark:text-gray-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isExpanded ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && question && (
                    <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50/30 dark:bg-gray-100/5">
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Question</h3>
                        <p className="text-sm text-foreground mb-4">{question.question}</p>
                        
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2">Options:</h4>
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optIdx) => {
                            const isCorrect = option === question.correct_answer;
                            
                            return (
                              <div
                                key={optIdx}
                                className={`p-2 rounded text-sm border border-gray-200/40 dark:border-gray-700/30 ${
                                  isCorrect
                                    ? 'text-green-600 dark:text-green-400 border-green-500 dark:border-green-400'
                                    : 'text-foreground'
                                }`}
                              >
                                {option}
                                {isCorrect && (
                                  <span className="ml-2 text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className={`mb-4 p-2 rounded-lg text-sm border ${
                          attempt.correct
                            ? 'border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 bg-transparent'
                            : 'border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 bg-transparent'
                        }`}>
                          <span className="font-semibold flex items-center gap-1.5">
                            {attempt.correct ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                </svg>
                                Correct
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Incorrect
                              </>
                            )}
                          </span>
                        </div>

                        {question.hint && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2">Hint:</h4>
                            <p className="text-sm text-foreground p-3 rounded border border-gray-200/40 dark:border-gray-700/30 bg-transparent">
                              {question.hint}
                            </p>
                          </div>
                        )}

                        {question.explanation && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2">Explanation:</h4>
                            <p className="text-sm text-foreground p-3 rounded border border-gray-200/40 dark:border-gray-700/30 bg-transparent">
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

