"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Question } from "@/lib/types";
import { startSession, recordAttempt, endSession } from "@/lib/analytics";
import { useSessionTimer } from "@/hooks/useSessionTimer";
import QuestionCard from "@/components/QuestionCard";
import Link from "next/link";
import { useQuizStats } from "@/contexts/QuizStatsContext";

export default function PersonalLearnPage() {
  const router = useRouter();
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const selectedOption = selectedOptions.get(currentQuestionIndex) || null;
  const showExplanation = showExplanations.get(currentQuestionIndex) || false;

  const { elapsedTime, start: startTimer, stop: stopTimer } = useSessionTimer();

  // Load questions from API
  useEffect(() => {
    let isMounted = true;

    async function initializeLearn() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/questions/learn/personal`);

        if (!response.ok) {
          let errorMsg = `Failed to load personal questions`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
            throw new Error(errorMsg);
          } catch (jsonError) {
            throw new Error(`${errorMsg}: ${response.statusText}`);
          }
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(`Invalid data format: expected array`);
        }

        if (data.length === 0) {
          throw new Error(`No personal questions found.`);
        }

        if (!isMounted) return;

        setQuestions(data);

        // Start session
        const newSessionId = await startSession(
          `learn-personal`,
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
        console.error("Error initializing personal learn mode:", error);
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
  }, [startTimer]);

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

  // Update header stats
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

  // Track start time for questions
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
      
      // Auto-hide mobile menu when selecting an option
      setShowMobileMenu(false);

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
          topic: `learn-personal`,
          correct: isCorrect,
          timeSpent,
          hintUsed: false,
          explanationViewed: true,
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
      questionStartTimes,
    ]
  );

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      setIsAnswered(selectedOptions.has(newIndex));
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
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key >= "1" && e.key <= "4" && !isAnswered) {
        e.preventDefault();
        const optionIndex = parseInt(e.key) - 1;
        if (optionIndex < currentQuestion.options.length) {
          handleOptionSelect(currentQuestion.options[optionIndex]);
        }
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePreviousQuestion();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextQuestion();
      }

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        handleExplanationToggle();
      }

      if ((e.key === "n" || e.key === "N") && isAnswered) {
        e.preventDefault();
        handleNextQuestion();
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
                    href="/personal"
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-transparent border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    Back to Personal
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
            No questions available.
          </p>
          <Link href="/personal" className="text-sm text-foreground hover:underline">
            ← Back to Personal
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
          <Link href="/personal" className="text-sm text-foreground hover:underline">
            ← Back to Personal
          </Link>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = selectedOptions.size;

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Compact on Mobile */}
      <div className="flex-shrink-0 p-2 md:p-3 border-b border-gray-200 dark:border-gray-800 bg-[#ea580c]/5 dark:bg-[#ea580c]/10">
        <div className="flex items-center justify-between mb-1 md:mb-2 gap-2">
          {/* Left: Menu Button + Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Mobile Menu Button - Prominent on Left */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 -ml-1 text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 active:bg-gray-50/25 dark:active:bg-gray-800/20 rounded-lg transition-colors touch-manipulation"
              aria-label="Toggle navigation menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs md:text-sm font-semibold text-foreground truncate">
                Learn - Personal Exam Questions
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500 sm:hidden">
                {answeredCount}/{questions.length}
              </span>
            </div>
          </div>
          {/* Right: Progress + Next Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-500 hidden sm:inline">
              {answeredCount}/{questions.length}
            </span>
            {/* Next Button - Show when answered and incorrect */}
            {isAnswered && selectedOption !== currentQuestion?.correct_answer && (
              <button
                onClick={() => {
                  handleNextQuestion();
                  setShowMobileMenu(false);
                }}
                disabled={currentQuestionIndex === questions.length - 1}
                className="px-3 py-1.5 text-xs md:text-sm font-medium text-background bg-[#ea580c] rounded-lg hover:bg-[#c2410c] active:bg-[#9a3412] transition-colors touch-manipulation shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next question"
              >
                Next →
              </button>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500 sm:hidden mb-1">
          {answeredCount}/{questions.length} answered
        </div>
        <div className="w-full bg-gray-100/30 dark:bg-gray-100/10 rounded-full h-1 md:h-2">
          <div
            className="bg-[#ea580c] h-1 md:h-2 rounded-full transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 md:px-6 py-4 md:py-8">
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

            {/* Navigation Buttons - Mobile Optimized */}
            <div className="mt-4 md:mt-8 flex justify-between items-center gap-2">
              <button
                onClick={() => {
                  handlePreviousQuestion();
                  setShowMobileMenu(false);
                }}
                disabled={currentQuestionIndex === 0}
                className="px-3 md:px-4 py-2.5 text-xs md:text-sm text-foreground bg-transparent border border-gray-200/40 dark:border-gray-700/30 rounded-lg hover:bg-gray-50/15 dark:hover:bg-gray-800/10 active:bg-gray-50/25 dark:active:bg-gray-800/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 touch-manipulation"
                aria-label="Previous question"
              >
                ← Prev
              </button>

              <button
                onClick={() => {
                  handleNextQuestion();
                  setShowMobileMenu(false);
                }}
                disabled={currentQuestionIndex === questions.length - 1}
                className="px-3 md:px-4 py-2.5 text-xs md:text-sm text-foreground bg-transparent border border-gray-200/40 dark:border-gray-700/30 rounded-lg hover:bg-gray-50/15 dark:hover:bg-gray-800/10 active:bg-gray-50/25 dark:active:bg-gray-800/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 touch-manipulation"
                aria-label="Next question"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay - Auto-hide when interacting */}
        {showMobileMenu && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setShowMobileMenu(false)}
            onTouchStart={() => setShowMobileMenu(false)}
          />
        )}

        {/* Right Side: Question Navigation Sidebar - Hidden on mobile, shown as drawer */}
        <div className={`lg:w-80 lg:sticky lg:top-0 lg:self-start lg:block fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto bg-background border-l border-gray-200 dark:border-gray-800 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${
          showMobileMenu ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}>
          <div className="h-full overflow-y-auto p-3 md:p-4">
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <h3 className="text-sm font-semibold text-foreground">
                Navigation
              </h3>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="mb-3 md:mb-4">
              <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
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
                <span className="text-sm font-medium text-foreground min-w-[80px] md:min-w-[120px] text-center">
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
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-1">
              <div className="flex flex-wrap gap-1 md:gap-1.5">
                {questions.map((_, index) => {
                  const isAttempted = selectedOptions.has(index);
                  const hasExplanation = showExplanations.get(index) || false;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        handleQuestionSelect(index);
                        setShowMobileMenu(false);
                      }}
                      className={`w-7 h-7 md:w-8 md:h-8 text-xs font-medium rounded-lg transition-all flex items-center justify-center border border-gray-200/40 dark:border-gray-700/30 touch-manipulation active:scale-95 ${
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
            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-800 hidden lg:block">
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
    </main>
  );
}
