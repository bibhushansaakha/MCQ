'use client';

import { Question } from '@/lib/types';
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
  onOptionSelect,
  onHintToggle,
  onExplanationToggle,
  onNext,
}: QuestionCardProps) {
  const isCorrect = selectedOption === question.correct_answer;

  return (
    <div className="pb-8">
      <div className="mb-6 flex justify-between items-center">
        <span className="text-sm text-gray-500 dark:text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="w-32 bg-gray-100/30 dark:bg-gray-100/10 rounded-full h-1">
          <div
            className="bg-foreground h-1 rounded-full transition-[width]"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-foreground mb-8 leading-relaxed">
        {question.question}
      </h2>

      <div className="space-y-2 mb-8">
        {question.options.map((option, index) => (
          <OptionButton
            key={index}
            option={option}
            isSelected={selectedOption === option}
            isCorrect={isAnswered && option === question.correct_answer}
            isWrong={isAnswered && selectedOption === option && !isCorrect}
            isAnswered={isAnswered}
            onClick={() => onOptionSelect(option)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={onHintToggle}
          className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
        >
          {showHint ? 'Hide Hint' : 'Show Hint'}
        </button>
        <button
          onClick={onExplanationToggle}
          className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
        >
          {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
        </button>
      </div>

      <HintDisplay hint={question.hint} isVisible={showHint} />
      <ExplanationDisplay explanation={question.explanation} isVisible={showExplanation} />

      {isAnswered && !isCorrect && (
        <button
          onClick={onNext}
          className="mt-8 w-full px-4 py-2.5 text-foreground bg-transparent border border-gray-200 dark:border-gray-800 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10 font-medium"
        >
          Next Question
        </button>
      )}
    </div>
  );
}

