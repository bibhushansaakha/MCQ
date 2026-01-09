'use client';

import { Question, ExamMode } from '@/lib/types';
import OptionButton from './OptionButton';
import HintDisplay from './HintDisplay';
import ExplanationDisplay from './ExplanationDisplay';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOption: string | null;
  showHint: boolean;
  showExplanation: boolean;
  isAnswered: boolean;
  correctAnswer: string | null;
  examMode?: ExamMode;
  onOptionSelect: (option: string) => void;
  onHintToggle: () => void;
  onExplanationToggle: () => void;
  onNext: () => void;
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  showHint,
  showExplanation,
  isAnswered,
  correctAnswer,
  examMode,
  onOptionSelect,
  onHintToggle,
  onExplanationToggle,
  onNext,
}: QuestionCardProps) {
  const isCorrect = selectedOption === question.correct_answer;
  const isExamMode = examMode === 'quick-test' || examMode === 'full-test';
  const showCorrectAnswer = examMode && isExamMode ? false : (isAnswered && correctAnswer !== null);
  // In learn mode (chapterwise), always show explanation when answered
  const shouldShowExplanation = !isExamMode && isAnswered && showExplanation;

  return (
    <div className="pb-4 md:pb-8">
      <h2 className="text-lg md:text-2xl font-semibold text-foreground mb-4 md:mb-8 leading-relaxed">
        {question.question}
      </h2>

      <div className="space-y-2 mb-4 md:mb-8" role="radiogroup" aria-label="Answer options">
        {question.options.map((option, index) => (
          <OptionButton
            key={index}
            option={option}
            isSelected={selectedOption === option}
            isCorrect={showCorrectAnswer && option === question.correct_answer}
            isWrong={showCorrectAnswer && selectedOption === option && !isCorrect}
            isAnswered={isAnswered && !isExamMode}
            onClick={() => onOptionSelect(option)}
          />
        ))}
      </div>

      {!isExamMode && (
        <>
      <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
        <button
          onClick={onHintToggle}
          className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
          title="Press H"
        >
          {showHint ? 'Hide Hint' : 'Hint'} <span className="hidden md:inline text-xs opacity-50">(H)</span>
        </button>
        <button
          onClick={onExplanationToggle}
          className="px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
          title="Press E"
        >
          {showExplanation ? 'Hide Exp.' : 'Explanation'} <span className="hidden md:inline text-xs opacity-50">(E)</span>
        </button>
      </div>
      <div className="mb-3 md:mb-4 text-xs text-gray-500 dark:text-gray-500 hidden md:block">
        <span>Shortcuts: </span>
        <span className="px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-100/10 rounded">1-4</span>
        <span className="mx-1">for options</span>
        <span className="px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-100/10 rounded mx-1">N</span>
        <span>for next</span>
      </div>

      <HintDisplay hint={question.hint} isVisible={showHint} />
      <ExplanationDisplay explanation={question.explanation} isVisible={shouldShowExplanation} />
        </>
      )}
    </div>
  );
}

