"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Question } from "@/lib/types";
import { startSession, recordAttempt, endSession } from "@/lib/analytics";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import QuestionCard from "@/components/QuestionCard";
import Link from "next/link";
import { useQuizStats } from "@/contexts/QuizStatsContext";

export default function LearnQuizPage() {
  const params = useParams();
  const router = useRouter();
  const chapter = params.chapter as string;
  const { setStats } = useQuizStats();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Map<number, string>>(
    new Map()
  );
  const [showExplanations, setShowExplanations] = useState<
    Map<number, boolean>
  >(new Map());
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionStartTimes, setQuestionStartTimes] = useState<
    Map<number, number>
  >(new Map());
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const selectedOption = selectedOptions.get(currentQuestionIndex) || null;
  const showExplanation = showExplanations.get(currentQuestionIndex) || false;

  const { elapsedTime, start: startTimer, stop: stopTimer } = useSessionTimer();

  // Load questions from API - only run once when chapter changes
  useEffect(() => {
    let isMounted = true;

    async function initializeLearn() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/questions/learn/${chapter}`);

        // Handle network errors
        if (!response.ok) {
          let errorMsg = `Failed to load questions for chapter ${chapter}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
            const details = errorData.details ? ` (${errorData.details})` : "";
            throw new Error(`${errorMsg}${details}`);
          } catch (jsonError) {
            // If JSON parsing fails, use status text
            throw new Error(`${errorMsg}: ${response.statusText}`);
          }
        }

        // Parse JSON response
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error(`Invalid response format from server`);
        }

        // Validate response structure
        if (!Array.isArray(data)) {
          throw new Error(
            `Invalid data format: expected array, got ${typeof data}`
          );
        }

        if (data.length === 0) {
          throw new Error(
            `No questions found for chapter ${chapter}. Please check if the JSON files exist.`
          );
        }

        // Only update state if component is still mounted
        if (!isMounted) return;

        setQuestions(data);

        // Start session
        const newSessionId = await startSession(
          `learn-${chapter}`,
          "chapterwise"
        );
        setSessionId(newSessionId);
        startTimer();

        // Initialize start times for all questions
        const startTimes = new Map<number, number>();
        data.forEach((_, index) => {
          startTimes.set(index, Date.now());
        });
        setQuestionStartTimes(startTimes);
      } catch (error) {
        if (!isMounted) return;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error initializing learn mode:", error);
        setError(errorMessage);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeLearn();

    return () => {
      isMounted = false;
    };
  }, [chapter, startTimer]); // startTimer is stable (useCallback)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        endSession(sessionId).catch((err) =>
          console.error("Error ending session:", err)
        );
      }
      setStats(null);
    };
  }, [sessionId, setStats]);

  // Update header stats - use ref to throttle updates and prevent excessive re-renders
  const lastStatsUpdateRef = useRef<{
    correct: number;
    total: number;
    timeElapsed: number;
  } | null>(null);

  useEffect(() => {
    if (totalAnswered > 0) {
      const newStats = {
        correct: correctCount,
        total: totalAnswered,
        timeElapsed: elapsedTime,
        hintsUsed: 0,
      };

      // Only update if stats actually changed (not just time)
      const last = lastStatsUpdateRef.current;
      if (
        !last ||
        last.correct !== newStats.correct ||
        last.total !== newStats.total ||
        Math.abs(last.timeElapsed - newStats.timeElapsed) >= 1
      ) {
        setStats(newStats);
        lastStatsUpdateRef.current = {
          correct: newStats.correct,
          total: newStats.total,
          timeElapsed: newStats.timeElapsed,
        };
      }
    }
  }, [correctCount, totalAnswered, elapsedTime, setStats]);

  // Update isAnswered when question changes
  useEffect(() => {
    setIsAnswered(selectedOptions.has(currentQuestionIndex));
  }, [currentQuestionIndex, selectedOptions]);

  // Track start time for questions separately to avoid dependency issues
  useEffect(() => {
    if (!questionStartTimes.has(currentQuestionIndex)) {
      setQuestionStartTimes((prev) =>
        new Map(prev).set(currentQuestionIndex, Date.now())
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]); // questionStartTimes intentionally excluded to avoid unnecessary re-runs

  const handleOptionSelect = useCallback(
    async (option: string) => {
      if (isAnswered) return;

      setSelectedOptions((prev) =>
        new Map(prev).set(currentQuestionIndex, option)
      );
      setIsAnswered(true);

      // Always show explanation after answering
      setShowExplanations((prev) =>
        new Map(prev).set(currentQuestionIndex, true)
      );

      const startTime =
        questionStartTimes.get(currentQuestionIndex) || Date.now();
      const timeSpent = Date.now() - startTime;
      const isCorrect = option === currentQuestion?.correct_answer;

      if (currentQuestion && sessionId) {
        await recordAttempt(sessionId, {
          questionId: `${
            currentQuestion.id ||
            currentQuestion.question_number ||
            currentQuestionIndex
          }`,
          topic: `learn-${chapter}`,
          correct: isCorrect,
          timeSpent,
          hintUsed: false,
          explanationViewed: true, // Always viewed in learn mode
          timestamp: Date.now(),
          selectedOption: option,
        }).catch((err) => console.error("Error recording attempt:", err));
      }

      setTotalAnswered((prev) => prev + 1);
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
    },
    [
      isAnswered,
      currentQuestionIndex,
      currentQuestion,
      sessionId,
      chapter,
      questionStartTimes,
    ]
  );

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      setIsAnswered(selectedOptions.has(newIndex));
      // Track start time for the new question
      if (!questionStartTimes.has(newIndex)) {
        setQuestionStartTimes((prev) =>
          new Map(prev).set(newIndex, Date.now())
        );
      }
    }
  }, [
    currentQuestionIndex,
    questions.length,
    selectedOptions,
    questionStartTimes,
  ]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      setIsAnswered(selectedOptions.has(newIndex));
      // Track start time for the new question
      if (!questionStartTimes.has(newIndex)) {
        setQuestionStartTimes((prev) =>
          new Map(prev).set(newIndex, Date.now())
        );
      }
    }
  }, [currentQuestionIndex, selectedOptions, questionStartTimes]);

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsAnswered(selectedOptions.has(index));
    // Track start time for the selected question
    if (!questionStartTimes.has(index)) {
      setQuestionStartTimes((prev) => new Map(prev).set(index, Date.now()));
    }
  };

  const handleExplanationToggle = useCallback(() => {
    setShowExplanations((prev) => {
      const newMap = new Map(prev);
      const currentValue = newMap.get(currentQuestionIndex) || false;
      newMap.set(currentQuestionIndex, !currentValue);
      return newMap;
    });
  }, [currentQuestionIndex]);

  // Keyboard handlers
  useEffect(() => {
    if (!currentQuestion) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't handle if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Number keys 1-4 for options
      if (e.key >= "1" && e.key <= "4" && !isAnswered) {
        e.preventDefault();
        const optionIndex = parseInt(e.key) - 1;
        if (optionIndex < currentQuestion.options.length) {
          handleOptionSelect(currentQuestion.options[optionIndex]);
        }
      }

      // Arrow keys for navigation
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePreviousQuestion();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextQuestion();
      }

      // E key to toggle explanation
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        handleExplanationToggle();
      }

      // N key for next question (when answered)
      if ((e.key === "n" || e.key === "N") && isAnswered) {
        e.preventDefault();
        handleNextQuestion();
      }

      // H key for hint (though hints are not shown in learn mode, keeping for consistency)
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        // Hints are not available in learn mode, but we can show explanation instead
        if (!isAnswered) {
          // If not answered, answer first then show explanation
          // This is a no-op in learn mode since hints aren't used
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [
    currentQuestion,
    isAnswered,
    handleOptionSelect,
    handleNextQuestion,
    handlePreviousQuestion,
    handleExplanationToggle,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-800 border-t-foreground mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            Loading questions...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                  Error Loading Questions
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                  {error}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      window.location.reload();
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                  <Link
                    href="/"
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-transparent border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            No questions available for chapter {chapter}.
          </p>
          <Link href="/" className="text-sm text-foreground hover:underline">
            ← Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  if (!currentQuestion && !isLoading && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            Question not found.
          </p>
          <Link href="/" className="text-sm text-foreground hover:underline">
            ← Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = selectedOptions.size;

  // Available chapters (based on files in learn directory)
  const availableChapters = [1, 2, 3, 4, 5, 6, 8, 9, 10];
  const currentChapterNum = parseInt(chapter, 10);

  // Validate chapter number
  const isValidChapter =
    !isNaN(currentChapterNum) && availableChapters.includes(currentChapterNum);
  const currentChapterIndex = isValidChapter
    ? availableChapters.indexOf(currentChapterNum)
    : -1;
  const hasPreviousChapter = currentChapterIndex > 0;
  const hasNextChapter =
    currentChapterIndex >= 0 &&
    currentChapterIndex < availableChapters.length - 1;
  const previousChapter = hasPreviousChapter
    ? availableChapters[currentChapterIndex - 1]
    : null;
  const nextChapter = hasNextChapter
    ? availableChapters[currentChapterIndex + 1]
    : null;

  const handleChapterChange = (newChapter: number) => {
    if (!isNaN(newChapter) && newChapter > 0) {
      router.push(`/quiz/learn/${newChapter}`);
    }
  };

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-gray-500 hover:text-foreground mb-4 inline-block"
          >
            ← Back to Topics
          </Link>
          <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-100/5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-semibold text-foreground">
                  Learn Mode - Chapter {chapter}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  {answeredCount} / {questions.length} answered
                </span>
              </div>

              {/* Chapter Navigation */}
              <div className="flex items-center gap-2">
                {/* Previous Chapter Button */}
                <button
                  onClick={() =>
                    previousChapter && handleChapterChange(previousChapter)
                  }
                  disabled={!hasPreviousChapter}
                  className="px-3 py-1.5 text-xs font-medium text-foreground bg-transparent border border-gray-200/40 dark:border-gray-700/30 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  aria-label="Previous chapter"
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
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Ch {previousChapter || "-"}
                </button>

                {/* Chapter Selector Dropdown */}
                <select
                  value={currentChapterNum}
                  onChange={(e) =>
                    handleChapterChange(parseInt(e.target.value, 10))
                  }
                  className="px-3 py-1.5 text-xs font-medium text-foreground bg-background border border-gray-200/40 dark:border-gray-700/30 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  aria-label="Select chapter"
                >
                  {availableChapters.map((ch) => (
                    <option key={ch} value={ch}>
                      Chapter {ch}
                    </option>
                  ))}
                </select>

                {/* Next Chapter Button */}
                <button
                  onClick={() =>
                    nextChapter && handleChapterChange(nextChapter)
                  }
                  disabled={!hasNextChapter}
                  className="px-3 py-1.5 text-xs font-medium text-foreground bg-transparent border border-gray-200/40 dark:border-gray-700/30 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  aria-label="Next chapter"
                >
                  Ch {nextChapter || "-"}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="w-full bg-gray-100/30 dark:bg-gray-100/10 rounded-full h-2">
              <div
                className="bg-foreground h-2 rounded-full transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Layout: Question on Left, Navigation on Right */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side: Question and Options */}
          <div className="flex-1 lg:max-w-3xl">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              selectedOption={selectedOption}
              showHint={false}
              showExplanation={showExplanation}
              isAnswered={isAnswered}
              correctAnswer={currentQuestion.correct_answer}
              examMode="chapterwise"
              onOptionSelect={handleOptionSelect}
              onHintToggle={() => {}}
              onExplanationToggle={handleExplanationToggle}
              onNext={handleNextQuestion}
            />

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 text-sm text-foreground bg-transparent border border-gray-200/40 dark:border-gray-700/30 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous question"
              >
                Previous
              </button>

              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                className="px-4 py-2 text-sm text-foreground bg-transparent border border-gray-200/40 dark:border-gray-700/30 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next question"
              >
                Next
              </button>
            </div>
          </div>

          {/* Right Side: Question Navigation Sidebar */}
          <div className="lg:w-80 lg:sticky lg:top-20 lg:self-start">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-100/5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Question Navigation
                </h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    onClick={handlePreviousQuestion}
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
                  <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
                    {currentQuestionIndex + 1} / {questions.length}
                  </span>
                  <button
                    onClick={handleNextQuestion}
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
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-1">
                <div className="flex flex-wrap gap-1.5">
                  {questions.map((_, index) => {
                    const isAttempted = selectedOptions.has(index);
                    const hasExplanation = showExplanations.get(index) || false;
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuestionSelect(index)}
                        className={`w-8 h-8 text-xs font-medium rounded-lg transition-all flex items-center justify-center border border-gray-200/40 dark:border-gray-700/30 ${
                          index === currentQuestionIndex
                            ? "text-white bg-[#ea580c] ring-2 ring-offset-1 ring-[#ea580c]/50 scale-105"
                            : isAttempted
                            ? hasExplanation
                              ? "text-[#ea580c] dark:text-[#ea580c] hover:scale-105 bg-[#ea580c]/20 dark:bg-[#ea580c]/30"
                              : "text-[#ea580c] dark:text-[#ea580c] hover:scale-105 bg-[#ea580c]/10 dark:bg-[#ea580c]/20"
                            : "text-foreground hover:scale-105 bg-transparent hover:bg-gray-50/15 dark:hover:bg-gray-800/10"
                        }`}
                        title={`Question ${index + 1}${
                          isAttempted ? " - Answered" : " - Not answered"
                        }`}
                        aria-label={`Go to question ${index + 1}${
                          isAttempted ? " (answered)" : " (not answered)"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                  <div>Keyboard shortcuts:</div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      1-4
                    </kbd>
                    <span>Select option</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      ← →
                    </kbd>
                    <span>Navigate questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      E
                    </kbd>
                    <span>Toggle explanation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
