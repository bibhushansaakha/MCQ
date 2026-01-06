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
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadHistory() {
      try {
        const sessions = getAllSessions();
        const items: HistoryItem[] = [];

        // Collect all attempts with their session info
        for (const session of sessions) {
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
              Question History
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Review all questions you&apos;ve attempted
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/analytics"
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
            >
              Analytics
            </Link>
            <Link
              href="/"
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
            >
              Back to Topics
            </Link>
            <ThemeToggleWrapper />
          </div>
        </div>

        {/* Filter */}
        {topics.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`px-3 py-1.5 text-sm rounded border ${
                selectedTopic === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-foreground border-gray-200 dark:border-gray-800 hover:bg-gray-50/15 dark:hover:bg-gray-800/10'
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
                    : 'bg-transparent text-foreground border-gray-200 dark:border-gray-800 hover:bg-gray-50/15 dark:hover:bg-gray-800/10'
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
              className="inline-block px-4 py-2 text-sm text-foreground bg-transparent border border-gray-200 dark:border-gray-800 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10"
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
                  className="rounded border border-gray-100 dark:border-gray-800 overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50/15 dark:hover:bg-gray-800/10"
                    onClick={() => toggleExpand(index)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              attempt.correct
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            {attempt.correct ? '✓' : '✗'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {sessionTopic} • {sessionDate}
                          </span>
                          {attempt.hintUsed && (
                            <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-500">
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
                      <button className="ml-4 text-gray-400 dark:text-gray-600">
                        {isExpanded ? '▼' : '▶'}
                      </button>
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
                                className={`p-2 rounded text-sm ${
                                  isCorrect
                                    ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-500 border border-green-300 dark:border-green-800'
                                    : attempt.correct === false && !isCorrect
                                    ? 'bg-transparent text-foreground border border-gray-200 dark:border-gray-800'
                                    : 'bg-transparent text-foreground border border-gray-200 dark:border-gray-800'
                                }`}
                              >
                                {option}
                                {isCorrect && (
                                  <span className="ml-2 text-xs font-semibold">✓ Correct Answer</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className={`mb-4 p-2 rounded text-sm ${
                          attempt.correct
                            ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-500'
                            : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-500'
                        }`}>
                          <span className="font-semibold">
                            {attempt.correct ? '✓ Correct' : '✗ Incorrect'}
                          </span>
                        </div>

                        {question.hint && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2">Hint:</h4>
                            <p className="text-sm text-foreground p-3 rounded border-l-2 border-yellow-400 bg-yellow-50/30 dark:bg-yellow-950/10">
                              {question.hint}
                            </p>
                          </div>
                        )}

                        {question.explanation && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2">Explanation:</h4>
                            <p className="text-sm text-foreground p-3 rounded border-l-2 border-blue-400 bg-blue-50/30 dark:bg-blue-950/10">
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

