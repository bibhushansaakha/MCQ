'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Question } from '@/lib/types';
import { loadQuestions, shuffleQuestions, getNextQuestion } from '@/lib/questionUtils';
import { startSession, recordAttempt, endSession } from '@/lib/analytics';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import QuestionCard from '@/components/QuestionCard';
import Link from 'next/link';
import { useQuizStats } from '@/contexts/QuizStatsContext';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = params.topic as string;
  const { setStats } = useQuizStats();
  
  // Parse filters from URL
  const chapters = searchParams.get('chapters')?.split(',').filter(Boolean) || [];
  const difficulties = (searchParams.get('difficulties')?.split(',').filter(Boolean) || []) as ('easy' | 'difficult')[];
  const sources = searchParams.get('sources')?.split(',').filter(Boolean) || [];
  
  const filters = {
    chapters: chapters.length > 0 ? chapters : undefined,
    difficulties: difficulties.length > 0 ? difficulties : undefined,
    sources: sources.length > 0 ? sources : undefined,
  };
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [shownIndices, setShownIndices] = useState<Set<number>>(new Set());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [hintUsedForCurrentQuestion, setHintUsedForCurrentQuestion] = useState(false);
  const [explanationViewedForCurrentQuestion, setExplanationViewedForCurrentQuestion] = useState(false);
  const autoNextTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { elapsedTime, start: startTimer, stop: stopTimer } = useSessionTimer();

  useEffect(() => {
    async function initializeQuiz() {
      try {
        const loadedQuestions = await loadQuestions(topicId, filters);
        if (loadedQuestions.length === 0) {
          // No questions match filters, show message
          return;
        }
        setQuestions(loadedQuestions);
        const shuffled = shuffleQuestions(loadedQuestions);
        setShuffledQuestions(shuffled);
        
        // Start session
        const newSessionId = await startSession(topicId, 'chapterwise');
        setSessionId(newSessionId);
        startTimer();
        
        // Load first question
        const firstQuestion = shuffled[0];
        if (firstQuestion) {
          setCurrentQuestion(firstQuestion);
          setShownIndices(new Set([0]));
          setQuestionStartTime(Date.now());
        }
      } catch (error) {
        console.error('Error loading questions:', error);
      }
    }

    initializeQuiz();

    return () => {
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, chapters.join(','), difficulties.join(','), sources.join(',')]);

  useEffect(() => {
    return () => {
      if (sessionId) {
        endSession(sessionId).catch(err => console.error('Error ending session:', err));
      }
      // Clear stats when leaving quiz page
      setStats(null);
    };
  }, [sessionId, setStats]);

  // Update header stats
  useEffect(() => {
    if (totalAnswered > 0) {
      setStats({
        correct: correctCount,
        total: totalAnswered,
        timeElapsed: elapsedTime,
        hintsUsed: hintsUsed,
      });
    }
  }, [correctCount, totalAnswered, elapsedTime, hintsUsed, setStats]);

  const handleNextQuestion = useCallback(() => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }

    setShuffledQuestions(prevShuffled => {
      setShownIndices(prevIndices => {
        const nextQuestion = getNextQuestion(prevShuffled, prevIndices);
        
        if (!nextQuestion) {
          // All questions shown, reset
          const reshuffled = shuffleQuestions(questions);
          setShuffledQuestions(reshuffled);
          const firstQuestion = reshuffled[0];
          if (firstQuestion) {
            setCurrentQuestion(firstQuestion);
            setShownIndices(new Set([0]));
          }
          return prevIndices;
        } else {
          const nextIndex = prevShuffled.indexOf(nextQuestion);
          setCurrentQuestion(nextQuestion);
          return new Set([...prevIndices, nextIndex]);
        }
      });
      return prevShuffled;
    });

    // Reset state for next question
    setSelectedOption(null);
    setShowHint(false);
    setShowExplanation(false);
    setIsAnswered(false);
    setQuestionStartTime(Date.now());
    setHintUsedForCurrentQuestion(false);
    setExplanationViewedForCurrentQuestion(false);
  }, [questions]);

  const handleOptionSelect = useCallback((option: string) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);
    
    const timeSpent = Date.now() - questionStartTime;
    const isCorrect = option === currentQuestion?.correct_answer;
    
    if (currentQuestion && sessionId) {
      recordAttempt(sessionId, {
        questionId: `${currentQuestion.question_number}`,
        topic: topicId,
        correct: isCorrect,
        timeSpent,
        hintUsed: hintUsedForCurrentQuestion,
        explanationViewed: explanationViewedForCurrentQuestion,
        timestamp: Date.now(),
      }).catch(err => console.error('Error recording attempt:', err));
    }

    setTotalAnswered(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      // Auto-advance after 500ms
      autoNextTimeoutRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 500);
    } else {
      // Show explanation for wrong answer
      setShowExplanation(true);
      setExplanationViewedForCurrentQuestion(true);
    }
  }, [isAnswered, currentQuestion, sessionId, topicId, questionStartTime, hintUsedForCurrentQuestion, explanationViewedForCurrentQuestion, handleNextQuestion]);

  const handleHintToggle = useCallback(() => {
    setShowHint(prev => {
      const newShowHint = !prev;
      if (newShowHint && !hintUsedForCurrentQuestion) {
        setHintsUsed(prevHints => prevHints + 1);
        setHintUsedForCurrentQuestion(true);
      }
      return newShowHint;
    });
  }, [hintUsedForCurrentQuestion]);

  const handleExplanationToggle = useCallback(() => {
    setShowExplanation(prev => {
      const newShowExplanation = !prev;
      if (newShowExplanation && !explanationViewedForCurrentQuestion) {
        setExplanationViewedForCurrentQuestion(true);
      }
      return newShowExplanation;
    });
  }, [explanationViewedForCurrentQuestion]);

  // Keyboard shortcuts for faster navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleHintToggle();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleExplanationToggle();
      } else if (e.key === 'n' || e.key === 'N') {
        const isCorrectAnswer = selectedOption === currentQuestion?.correct_answer;
        if (isAnswered && !isCorrectAnswer) {
          e.preventDefault();
          handleNextQuestion();
        }
      } else if (e.key >= '1' && e.key <= '4' && !isAnswered) {
        const optionIndex = parseInt(e.key) - 1;
        if (currentQuestion && currentQuestion.options[optionIndex]) {
          e.preventDefault();
          handleOptionSelect(currentQuestion.options[optionIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAnswered, selectedOption, currentQuestion, handleHintToggle, handleExplanationToggle, handleNextQuestion, handleOptionSelect]);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            No questions found matching your filters.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 text-sm text-foreground bg-transparent border border-gray-200 dark:border-gray-800 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10"
          >
            Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-800 border-t-foreground mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
          >
            ← Back
          </Link>
        </div>

        <QuestionCard
          question={currentQuestion}
          questionNumber={shownIndices.size}
          totalQuestions={questions.length}
          selectedOption={selectedOption}
          showHint={showHint}
          showExplanation={showExplanation}
          isAnswered={isAnswered}
          correctAnswer={currentQuestion.correct_answer}
          examMode="chapterwise"
          onOptionSelect={handleOptionSelect}
          onHintToggle={handleHintToggle}
          onExplanationToggle={handleExplanationToggle}
          onNext={handleNextQuestion}
        />
      </div>
    </main>
  );
}

