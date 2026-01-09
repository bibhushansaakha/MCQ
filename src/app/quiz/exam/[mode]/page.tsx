"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Question,
  QuestionWithChapter,
  ExamMode,
  EXAM_CONFIG,
} from "@/lib/types";
import { loadQuestionsFromAllChapters, loadOfficialModelQuestions, loadPastQuestions, loadPersonalQuestions } from "@/lib/questionUtils";
import { startSession, recordAttempt, endSession } from "@/lib/analytics";
import { useExamTimer } from "@/hooks/useExamTimer";
import QuestionCard from "@/components/QuestionCard";
import Link from "next/link";
import { useQuizStats } from "@/contexts/QuizStatsContext";

export default function ExamQuizPage() {
  const params = useParams();
  const router = useRouter();
  const mode = params.mode as ExamMode;
  const { setStats } = useQuizStats();

  const [questions, setQuestions] = useState<QuestionWithChapter[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Map<number, string>>(
    new Map()
  );
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionStartTimes, setQuestionStartTimes] = useState<
    Map<number, number>
  >(new Map());
  const [isExamComplete, setIsExamComplete] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const config =
    mode === "quick-test" || mode === "full-test" || 
    mode === "official-quick-test" || mode === "official-full-test" || mode === "official-random" ||
    mode === "past-quick-test" || mode === "past-full-test" || mode === "past-random" ||
    mode === "personal-quick-test" || mode === "personal-full-test" || mode === "personal-random"
      ? EXAM_CONFIG[mode] : null;
  const currentQuestion = questions[currentQuestionIndex] || null;
  const selectedOption = selectedOptions.get(currentQuestionIndex) || null;

  const handleTimeExpired = async () => {
    if (sessionId && !isExamComplete) {
      setIsExamComplete(true);
      // Save all unanswered questions as incorrect
      for (let i = 0; i < questions.length; i++) {
        if (!selectedOptions.has(i)) {
          const q = questions[i];
          const startTime = questionStartTimes.get(i) || Date.now();
          const timeSpent = Date.now() - startTime;
          await recordAttempt(sessionId, {
            questionId: `${q.id || q.question_number || i}`,
            topic: q.chapterId || "unknown",
            correct: false,
            timeSpent,
            hintUsed: false,
            explanationViewed: false,
            timestamp: Date.now(),
          }).catch((err) => console.error("Error recording attempt:", err));
        }
      }
      // End session
      await endSession(sessionId).catch((err) =>
        console.error("Error ending session:", err)
      );
      // Redirect to review
      router.push(`/review/${sessionId}`);
    }
  };

  const {
    remainingTime,
    formattedTime,
    start: startTimer,
    stop: stopTimer,
  } = useExamTimer({
    timeLimit: config?.timeLimit || 0,
    onTimeExpired: handleTimeExpired,
  });

  // Calculate stats for header (before early returns)
  const answeredCount = selectedOptions.size;
  const correctCount = Array.from(selectedOptions.entries()).filter(
    ([index, answer]) => questions[index]?.correct_answer === answer
  ).length;
  const elapsedTime =
    config && remainingTime !== null ? config.timeLimit - remainingTime : 0;

  // Update header stats
  useEffect(() => {
    if (answeredCount > 0 && sessionId && config) {
      setStats({
        correct: correctCount,
        total: answeredCount,
        timeElapsed: elapsedTime,
        hintsUsed: 0, // Exam mode doesn't use hints
      });
    }
    return () => {
      if (!sessionId) {
        setStats(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answeredCount, correctCount, elapsedTime, sessionId]);

  // Page close detection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isExamComplete) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isExamComplete]);

  // Handle page visibility change - end exam if closed
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && sessionId && !isExamComplete) {
        // User closed the page/tab
        const confirmed = window.confirm(
          "Are you sure you want to leave? The exam will end immediately and your progress will be saved."
        );

        if (confirmed || !document.hasFocus()) {
          setIsExamComplete(true);
          stopTimer();

          // Save all attempts
          for (let i = 0; i < questions.length; i++) {
            const selected = selectedOptions.get(i);
            if (selected) {
              const q = questions[i];
              const startTime = questionStartTimes.get(i) || Date.now();
              const timeSpent = Date.now() - startTime;
              await recordAttempt(sessionId, {
                questionId: `${q.id || q.question_number || i}`,
                topic: q.chapterId || "unknown",
                correct: selected === q.correct_answer,
                timeSpent,
                hintUsed: false,
                explanationViewed: false,
                timestamp: Date.now(),
              }).catch((err) => console.error("Error recording attempt:", err));
            }
          }

          await endSession(sessionId).catch((err) =>
            console.error("Error ending session:", err)
          );
          router.push(`/review/${sessionId}`);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    sessionId,
    isExamComplete,
    questions,
    selectedOptions,
    questionStartTimes,
    router,
    stopTimer,
  ]);

  useEffect(() => {
    if (!config) return;

    let isMounted = true;
    const examConfig = config; // Capture config for use inside async function

    async function initializeExam() {
      try {
        let loadedQuestions: QuestionWithChapter[] = [];
        let sessionToUse: string | null = null;

        // Check if we're retaking (sessionId stored in sessionStorage)
        if (typeof window !== 'undefined' && !sessionId) {
          const retakeSessionId = sessionStorage.getItem('retakeSessionId');
          if (retakeSessionId) {
            // Get the session with stored questions
            const { getAllSessions } = await import('@/lib/analytics');
            const sessions = await getAllSessions();
            const retakeSession = sessions.find(s => s.sessionId === retakeSessionId);
            
            if (retakeSession && retakeSession.questions && retakeSession.questions.length > 0) {
              // Use stored questions from retake session
              loadedQuestions = retakeSession.questions as QuestionWithChapter[];
              sessionToUse = retakeSessionId;
              // Clear the sessionStorage
              sessionStorage.removeItem('retakeSessionId');
            }
          }
        }

        // If no retake session found, load new questions based on mode
        if (loadedQuestions.length === 0) {
          if (mode === "official-quick-test" || mode === "official-full-test" || mode === "official-random") {
            loadedQuestions = await loadOfficialModelQuestions(
              examConfig.questionCount
            );
          } else if (mode === "past-quick-test" || mode === "past-full-test" || mode === "past-random") {
            loadedQuestions = await loadPastQuestions(
              examConfig.questionCount
            );
          } else if (mode === "personal-quick-test" || mode === "personal-full-test" || mode === "personal-random") {
            loadedQuestions = await loadPersonalQuestions(
              examConfig.questionCount
            );
          } else {
          loadedQuestions = await loadQuestionsFromAllChapters(
            examConfig.questionCount
          );
          }
        }

        if (!isMounted) return;

        setQuestions(loadedQuestions);

        // Start session only if we don't already have one
        if (!sessionId) {
          const topicName = mode.startsWith("official") ? "official-model-questions" :
                           mode.startsWith("past") ? "past-questions" :
                           mode.startsWith("personal") ? "personal-exam-questions" : "all-chapters";
          const newSessionId = sessionToUse || await startSession(topicName, mode, loadedQuestions);
          if (!isMounted) return;

          setSessionId(newSessionId);
          startTimer();
          // Initialize start times for all questions
          const startTimes = new Map<number, number>();
          loadedQuestions.forEach((_, index) => {
            startTimes.set(index, Date.now());
          });
          setQuestionStartTimes(startTimes);
          setHasUnsavedChanges(true);
        } else {
          // Update questions if session already exists
          const { updateSessionQuestions } = await import('@/lib/analytics');
          await updateSessionQuestions(sessionId, loadedQuestions);
        }
      } catch (error) {
        console.error("Error initializing exam:", error);
      }
    }

    initializeExam();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, config?.questionCount, startTimer]);

  // Update isAnswered when question changes and track start time
  useEffect(() => {
    setIsAnswered(selectedOptions.has(currentQuestionIndex));
    // Track start time for this question if not already set
    if (!questionStartTimes.has(currentQuestionIndex)) {
      setQuestionStartTimes((prev) =>
        new Map(prev).set(currentQuestionIndex, Date.now())
      );
    }
  }, [currentQuestionIndex, selectedOptions, questionStartTimes]);

  const handleOptionSelect = useCallback(async (option: string) => {
    if (isExamComplete) return;

    // Auto-hide mobile menu when selecting an option
    setShowMobileMenu(false);

    setSelectedOptions((prev) =>
      new Map(prev).set(currentQuestionIndex, option)
    );
    setIsAnswered(true);
    setHasUnsavedChanges(true);

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
        topic: currentQuestion.chapterId || "unknown",
        correct: isCorrect,
        timeSpent,
        hintUsed: false,
        explanationViewed: false,
        timestamp: Date.now(),
        selectedOption: option, // Store selected option
      }).catch((err) => console.error("Error recording attempt:", err));
    }
    // Don't auto-advance - let user navigate manually
  }, [isExamComplete, currentQuestionIndex, currentQuestion, sessionId, questionStartTimes]);

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
  }, [currentQuestionIndex, questions.length, selectedOptions, questionStartTimes]);

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

  const handleFinishExam = async () => {
    if (sessionId && !isExamComplete) {
      setIsExamComplete(true);
      stopTimer();

      // Save all unanswered questions as incorrect
      for (let i = 0; i < questions.length; i++) {
        if (!selectedOptions.has(i)) {
          const q = questions[i];
          const startTime = questionStartTimes.get(i) || Date.now();
          const timeSpent = Date.now() - startTime;
          await recordAttempt(sessionId, {
            questionId: `${q.id || q.question_number || i}`,
            topic: q.chapterId || "unknown",
            correct: false,
            timeSpent,
            hintUsed: false,
            explanationViewed: false,
            timestamp: Date.now(),
          }).catch((err) => console.error("Error recording attempt:", err));
        }
      }

      // End session
      await endSession(sessionId).catch((err) =>
        console.error("Error ending session:", err)
      );

      // Redirect to review
      router.push(`/review/${sessionId}`);
    }
  };

  // Keyboard handlers for exam mode (must be before early return)
  useEffect(() => {
    if (!config || !currentQuestion) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't handle if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Number keys 1-4 for options
      if (e.key >= '1' && e.key <= '4') {
        const optionIndex = parseInt(e.key) - 1;
        if (optionIndex < currentQuestion.options.length) {
          handleOptionSelect(currentQuestion.options[optionIndex]);
        }
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft') {
        handlePreviousQuestion();
      } else if (e.key === 'ArrowRight') {
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentQuestion, config, handleOptionSelect, handleNextQuestion, handlePreviousQuestion]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-800 border-t-foreground mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            Loading exam...
          </p>
        </div>
      </div>
    );
  }

  const progress = (answeredCount / questions.length) * 100;

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Timer and Progress - Top Bar - Compact on Mobile */}
      <div className="flex-shrink-0 p-2 md:p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-100/5">
        <div className="flex justify-between items-center mb-1 md:mb-2 gap-2">
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
                {mode === "quick-test" ? "Quick Test" : 
                 mode === "full-test" ? "Full Test" :
                 mode === "official-quick-test" ? "Official Quick" :
                 mode === "official-full-test" ? "Official Full" :
                 mode === "official-random" ? "Official Random" :
                 mode === "past-quick-test" ? "Past Quick" :
                 mode === "past-full-test" ? "Past Full" :
                 mode === "past-random" ? "Past Random" : "Exam"}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500 sm:hidden">
                {answeredCount}/{questions.length}
              </span>
            </div>
          </div>
          {/* Right: Timer + Progress Indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-500 hidden sm:inline">
              {answeredCount}/{questions.length}
            </span>
            <div
              className={`text-sm md:text-base lg:text-lg font-mono font-semibold whitespace-nowrap ${
                remainingTime < 5 * 60 * 1000
                  ? "text-red-600 dark:text-red-500"
                  : "text-foreground"
              }`}
            >
              {formattedTime}
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-100/30 dark:bg-gray-100/10 rounded-full h-1 md:h-2">
            <div
            className="bg-foreground h-1 md:h-2 rounded-full transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 sm:hidden">
          {answeredCount}/{questions.length} answered
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
              showExplanation={false}
              isAnswered={false}
              correctAnswer={null}
              examMode={mode}
              onOptionSelect={handleOptionSelect}
              onHintToggle={() => {}}
              onExplanationToggle={() => {}}
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
                onClick={handleFinishExam}
                className="px-3 md:px-6 py-2.5 text-xs md:text-sm font-medium text-background bg-[#ea580c] rounded-lg hover:bg-[#c2410c] active:bg-[#9a3412] transition-colors flex-1 md:flex-none touch-manipulation shadow-sm"
              >
                <span className="hidden md:inline">
                {answeredCount === questions.length
                  ? "Finish Exam"
                    : `Finish (${answeredCount}/${questions.length})`}
                </span>
                <span className="md:hidden">Finish</span>
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

        {/* Mobile Menu Overlay - Auto-hide when interacting with questions */}
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
                            ? "text-[#ea580c] dark:text-[#ea580c] hover:scale-105 bg-[#ea580c]/10 dark:bg-[#ea580c]/20"
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
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">1-4</kbd>
                    <span>Select option</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">← →</kbd>
                    <span>Navigate questions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
