"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  SessionData,
  QuestionAttempt,
  Question,
  QuestionWithChapter,
  ExamMode,
  EXAM_CONFIG,
} from "@/lib/types";
import {
  loadQuestionsFromAllChapters,
  loadQuestions,
  loadOfficialModelQuestions,
  loadPastQuestions,
  loadPersonalQuestions,
} from "@/lib/questionUtils";
import { formatTime, startSession } from "@/lib/analytics";
import ThemeToggleWrapper from "@/components/ThemeToggleWrapper";
import Link from "next/link";
import HintDisplay from "@/components/HintDisplay";
import ExplanationDisplay from "@/components/ExplanationDisplay";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [retaking, setRetaking] = useState(false);

  const [session, setSession] = useState<SessionData | null>(null);
  const [questions, setQuestions] = useState<
    (Question | QuestionWithChapter)[]
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (loading || !questions.length) return;

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
      // Number keys (1-9) to jump to question
      else if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key);
        if (num <= questions.length) {
          setCurrentQuestionIndex(num - 1);
        }
      }
      // Home/End keys
      else if (e.key === 'Home') {
        setCurrentQuestionIndex(0);
      } else if (e.key === 'End') {
        setCurrentQuestionIndex(questions.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestionIndex, questions.length, loading]);

  useEffect(() => {
    async function loadReviewData() {
      try {
        // Load session data from localStorage
        const { getAllSessions } = await import('@/lib/analytics');
        const sessions = await getAllSessions();
        const sessionData = sessions.find(s => s.sessionId === sessionId);
        
        if (!sessionData) {
          throw new Error("Session not found");
        }
        
        setSession(sessionData);

        // Use stored questions if available (for exam modes), otherwise load them
        let loadedQuestions: (Question | QuestionWithChapter)[] = [];

        if (sessionData.questions && sessionData.questions.length > 0) {
          // Use stored questions (exact questions from exam)
          loadedQuestions = sessionData.questions;
        } else {
          // Fallback: Load questions based on the session type
          if (
            sessionData.examMode === "quick-test" ||
            sessionData.examMode === "full-test"
          ) {
            // Load questions from all chapters
            const config = EXAM_CONFIG[sessionData.examMode];
            const fallbackQuestions = await loadQuestionsFromAllChapters(
              config.questionCount
            );
            loadedQuestions.push(...fallbackQuestions);
          } else if (
            sessionData.examMode === "official-quick-test" ||
            sessionData.examMode === "official-full-test" ||
            sessionData.examMode === "official-random"
          ) {
            // Load official model questions
            const config = EXAM_CONFIG[sessionData.examMode];
            const fallbackQuestions = await loadOfficialModelQuestions(
              config.questionCount
            );
            loadedQuestions.push(...fallbackQuestions);
          } else if (
            sessionData.examMode === "past-quick-test" ||
            sessionData.examMode === "past-full-test" ||
            sessionData.examMode === "past-random"
          ) {
            // Load past questions
            const config = EXAM_CONFIG[sessionData.examMode];
            const fallbackQuestions = await loadPastQuestions(
              config.questionCount
            );
            loadedQuestions.push(...fallbackQuestions);
          } else if (
            sessionData.examMode === "personal-quick-test" ||
            sessionData.examMode === "personal-full-test" ||
            sessionData.examMode === "personal-random"
          ) {
            // Load personal questions
            const config = EXAM_CONFIG[sessionData.examMode];
            const fallbackQuestions = await loadPersonalQuestions(
              config.questionCount
            );
            loadedQuestions.push(...fallbackQuestions);
          } else {
            // Load questions from the topic
            const fallbackQuestions = await loadQuestions(sessionData.topic);
            loadedQuestions.push(...fallbackQuestions);
          }
        }

        setQuestions(loadedQuestions);
      } catch (error) {
        console.error("Error loading review data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadReviewData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-800 border-t-foreground mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            Loading review...
          </p>
        </div>
      </div>
    );
  }

  if (!session || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Session not found
          </p>
          <Link
            href="/history"
            className="px-4 py-2 text-sm text-foreground bg-transparent border border-gray-200 dark:border-gray-800 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10"
          >
            Back to Attempts
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Create a map of attempts by question ID
  // Since questions are now ordered by attempts, we can match by index
  // But also create a map for lookup by questionId
  const attemptMap = new Map<string, QuestionAttempt>();
  session.attempts.forEach((attempt, index) => {
    // Map by the stored questionId
    attemptMap.set(attempt.questionId, attempt);
    // Also map by index for easier lookup
    attemptMap.set(index.toString(), attempt);
  });

  // Find attempt for current question
  // First try to match by index (since questions are ordered by attempts)
  let attempt = attemptMap.get(currentQuestionIndex.toString());

  // If not found, try to match by questionId
  if (!attempt) {
    const currentQuestionId = `${
      currentQuestion.id ||
      currentQuestion.question_number ||
      currentQuestionIndex
    }`;
    attempt = attemptMap.get(currentQuestionId);
  }

  // If still not found, try to match by the question's actual ID from the database
  if (!attempt && currentQuestionIndex < session.attempts.length) {
    attempt = session.attempts[currentQuestionIndex];
  }
  const isCorrect = attempt?.correct || false;
  const correctAnswer = currentQuestion.correct_answer;
  const examMode = session.examMode as ExamMode | undefined;

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <Link
            href="/history"
            className="text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
          >
            ← Back to Attempts
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggleWrapper />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-8 p-6 rounded-lg bg-gray-50/30 dark:bg-gray-100/5">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-semibold text-foreground">
              Exam Review
              {examMode && (
                <span className="ml-3 text-sm font-normal text-gray-500 dark:text-gray-500">
                  (
                  {examMode === "quick-test"
                    ? "Quick Test"
                    : examMode === "full-test"
                    ? "Full Test"
                    : examMode === "official-quick-test"
                    ? "Official Quick Test"
                    : examMode === "official-full-test"
                    ? "Official Full Test"
                    : examMode === "official-random"
                    ? "Official Random Practice"
                    : examMode === "past-quick-test"
                    ? "Past Quick Test"
                    : examMode === "past-full-test"
                    ? "Past Full Test"
                    : examMode === "past-random"
                    ? "Past Random Practice"
                    : "Chapterwise"}
                  )
                </span>
              )}
            </h1>
            {examMode && (
              examMode === "quick-test" || examMode === "full-test" ||
              examMode === "official-quick-test" || examMode === "official-full-test" || examMode === "official-random" ||
              examMode === "past-quick-test" || examMode === "past-full-test" || examMode === "past-random"
            ) && (
              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to retake this exam? This will start a new session.')) {
                    return;
                  }
                  setRetaking(true);
                  try {
                    // Determine topic name based on mode
                    const topicName = examMode.startsWith("official") ? "official-model-questions" :
                                     examMode.startsWith("past") ? "past-questions" : "all-chapters";
                    // Start a completely new session with the same questions
                    const newSessionId = await startSession(topicName, examMode, session.questions);
                    // Store the sessionId temporarily so exam page can find it
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('retakeSessionId', newSessionId);
                    }
                    // Navigate to exam page - it will use the stored sessionId
                    router.push(`/quiz/exam/${examMode}`);
                  } catch (error) {
                    console.error('Error retaking exam:', error);
                    alert('Failed to start retake. Please try again.');
                    setRetaking(false);
                  }
                }}
                disabled={retaking}
                className="px-4 py-2 text-sm font-medium text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retaking ? 'Starting...' : 'Retake Exam'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Total Questions
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {session.attempts.length || questions.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Correct
              </p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                {session.attempts.filter((a) => a.correct).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Incorrect
              </p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                {session.attempts.filter((a) => !a.correct).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Not Attempted
              </p>
              <p className="text-2xl font-semibold text-gray-500 dark:text-gray-400">
                {Math.max(0, questions.length - session.attempts.length)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Accuracy
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {session.attempts.length > 0
                  ? (
                      (session.attempts.filter((a) => a.correct).length /
                        session.attempts.length) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                %
              </p>
            </div>
          </div>
          {session.endTime && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Time Taken: {formatTime(session.totalTime)}
              </p>
            </div>
          )}
        </div>

        {/* Question Navigation */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentQuestionIndex === 0}
              className="p-2 text-foreground bg-transparent rounded-lg hover:bg-gray-50/15 dark:hover:bg-gray-800/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous question"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
              Question {currentQuestionIndex + 1} of {questions.length}
              <span className="block text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                Use ← → arrows or 1-9 keys
              </span>
            </span>
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1)
                )
              }
              disabled={currentQuestionIndex === questions.length - 1}
              className="p-2 text-foreground bg-transparent rounded-lg hover:bg-gray-50/15 dark:hover:bg-gray-800/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next question"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <div className="w-full">
            <div className="flex flex-wrap gap-1.5">
              {questions.map((_, index) => {
                // Get attempt by index (since questions are ordered by attempts)
                const qAttempt =
                  index < session.attempts.length
                    ? session.attempts[index]
                    : null;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 text-xs font-medium rounded-lg transition-all flex items-center justify-center border border-gray-200/40 dark:border-gray-700/30 ${
                      index === currentQuestionIndex
                        ? "text-foreground bg-gray-50/50 dark:bg-gray-800/30 ring-2 ring-offset-1 ring-gray-200/50 dark:ring-gray-700/50 scale-105"
                        : qAttempt?.correct
                        ? "text-green-600 dark:text-green-400 hover:scale-105 bg-transparent"
                        : qAttempt
                        ? "text-red-600 dark:text-red-400 hover:scale-105 bg-transparent"
                        : "text-foreground hover:scale-105 bg-transparent"
                    }`}
                    title={`Question ${index + 1}${
                      qAttempt
                        ? qAttempt.correct
                          ? " - Correct"
                          : " - Incorrect"
                        : " - Not answered"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Question Display */}
        <div className="rounded-lg bg-gray-50/30 dark:bg-gray-100/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Question {currentQuestionIndex + 1}
            </h2>
            {attempt && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${
                  isCorrect
                    ? "border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 bg-transparent"
                    : "border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 bg-transparent"
                }`}
              >
                {isCorrect ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span>{isCorrect ? "Correct" : "Incorrect"}</span>
              </div>
            )}
          </div>

          <p className="text-lg text-foreground mb-6 leading-relaxed">
            {currentQuestion.question}
          </p>

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isCorrectOption = option === correctAnswer;
              const isSelected = attempt?.selectedOption === option; // Use stored selected option

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg transition-colors border ${
                    isCorrectOption
                      ? "border-green-500 dark:border-green-400 bg-green-50/30 dark:bg-green-950/20"
                      : isSelected
                      ? "border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-950/20"
                      : "border-gray-200/40 dark:border-gray-700/30 bg-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`font-semibold text-sm ${
                        isCorrectOption
                          ? "text-green-600 dark:text-green-400"
                          : isSelected
                          ? "text-red-600 dark:text-red-400"
                          : "text-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span
                      className={`flex-1 ${
                        isCorrectOption
                          ? "text-green-600 dark:text-green-400 font-medium"
                          : isSelected
                          ? "text-red-600 dark:text-red-400"
                          : "text-foreground"
                      }`}
                    >
                      {option}
                    </span>
                    {isCorrectOption && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-xs font-semibold">Correct</span>
                      </div>
                    )}
                    {isSelected && !isCorrectOption && (
                      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <span className="text-xs font-semibold">Your Answer</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {attempt && (
            <div className="mb-4 p-3 rounded-lg bg-gray-100/50 dark:bg-gray-800/30 flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Time spent: {formatTime(attempt.timeSpent)}
              </p>
            </div>
          )}

          <HintDisplay hint={currentQuestion.hint} isVisible={true} />
          <ExplanationDisplay
            explanation={currentQuestion.explanation}
            isVisible={true}
          />
        </div>
      </div>
    </main>
  );
}
