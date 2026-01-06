'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Question } from '@/lib/types';
import { loadQuestions, shuffleQuestions, getNextQuestion } from '@/lib/questionUtils';
import { startSession, recordAttempt, endSession } from '@/lib/analytics';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import QuestionCard from '@/components/QuestionCard';
import SessionStats from '@/components/SessionStats';
import ThemeToggleWrapper from '@/components/ThemeToggleWrapper';
import Link from 'next/link';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topic as string;
  
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
        const loadedQuestions = await loadQuestions(topicId);
        setQuestions(loadedQuestions);
        const shuffled = shuffleQuestions(loadedQuestions);
        setShuffledQuestions(shuffled);
        
        // Start session
        const newSessionId = startSession(topicId);
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
  }, [topicId]);

  useEffect(() => {
    return () => {
      if (sessionId) {
        endSession(sessionId);
      }
    };
  }, [sessionId]);

  const handleOptionSelect = (option: string) => {
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
      });
    }

    setTotalAnswered(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      // Auto-advance after 1 second
      autoNextTimeoutRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 500);
    } else {
      // Show explanation for wrong answer
      setShowExplanation(true);
      setExplanationViewedForCurrentQuestion(true);
    }
  };

  const handleNextQuestion = () => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }

    const nextQuestion = getNextQuestion(shuffledQuestions, shownIndices);
    
    if (!nextQuestion) {
      // All questions shown, reset
      const reshuffled = shuffleQuestions(questions);
      setShuffledQuestions(reshuffled);
      setShownIndices(new Set());
      const firstQuestion = reshuffled[0];
      if (firstQuestion) {
        setCurrentQuestion(firstQuestion);
        setShownIndices(new Set([0]));
      }
    } else {
      const nextIndex = shuffledQuestions.indexOf(nextQuestion);
      setCurrentQuestion(nextQuestion);
      setShownIndices(prev => new Set([...prev, nextIndex]));
    }

    // Reset state for next question
    setSelectedOption(null);
    setShowHint(false);
    setShowExplanation(false);
    setIsAnswered(false);
    setQuestionStartTime(Date.now());
    setHintUsedForCurrentQuestion(false);
    setExplanationViewedForCurrentQuestion(false);
  };

  const handleHintToggle = () => {
    const newShowHint = !showHint;
    setShowHint(newShowHint);
    if (newShowHint && !hintUsedForCurrentQuestion) {
      setHintsUsed(prev => prev + 1);
      setHintUsedForCurrentQuestion(true);
    }
  };

  const handleExplanationToggle = () => {
    const newShowExplanation = !showExplanation;
    setShowExplanation(newShowExplanation);
    if (newShowExplanation && !explanationViewedForCurrentQuestion) {
      setExplanationViewedForCurrentQuestion(true);
    }
  };

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
        <div className="mb-8 flex justify-between items-center">
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
          >
            ← Back to Topics
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/history"
              className="text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
            >
              History
            </Link>
            <Link
              href="/analytics"
              className="text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
            >
              Analytics
            </Link>
            <ThemeToggleWrapper />
          </div>
        </div>

        <SessionStats
          correct={correctCount}
          total={totalAnswered}
          timeElapsed={elapsedTime}
          hintsUsed={hintsUsed}
        />

        <QuestionCard
          question={currentQuestion}
          questionNumber={shownIndices.size}
          totalQuestions={questions.length}
          selectedOption={selectedOption}
          showHint={showHint}
          showExplanation={showExplanation}
          isAnswered={isAnswered}
          correctAnswer={currentQuestion.correct_answer}
          onOptionSelect={handleOptionSelect}
          onHintToggle={handleHintToggle}
          onExplanationToggle={handleExplanationToggle}
          onNext={handleNextQuestion}
        />
      </div>
    </main>
  );
}

