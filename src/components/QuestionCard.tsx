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

  return (
    <div className="pb-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-500">
            Question {questionNumber} of {totalQuestions}
          </span>
          {question.difficulty && (
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded bg-gray-100/50 dark:bg-gray-100/10 ${
                question.difficulty === 'easy'
                  ? 'text-green-700 dark:text-green-500'
                  : 'text-orange-700 dark:text-orange-500'
              }`}
            >
              {question.difficulty === 'easy' ? 'Easy' : 'Difficult'}
            </span>
          )}
          {question.chapter && (
            <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-500 bg-gray-100/50 dark:bg-gray-100/10 rounded">
              {question.chapter}
            </span>
          )}
          {question.source && (
            <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-500 bg-gray-100/50 dark:bg-gray-100/10 rounded truncate max-w-[120px]">
              {question.source}
            </span>
          )}
        </div>
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

      <div className="space-y-2 mb-8" role="radiogroup" aria-label="Answer options">
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
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={onHintToggle}
          className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
          title="Press H"
        >
          {showHint ? 'Hide Hint' : 'Show Hint'} <span className="text-xs opacity-50">(H)</span>
        </button>
        <button
          onClick={onExplanationToggle}
          className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
          title="Press E"
        >
          {showExplanation ? 'Hide Explanation' : 'Show Explanation'} <span className="text-xs opacity-50">(E)</span>
        </button>
      </div>
      <div className="mb-4 text-xs text-gray-500 dark:text-gray-500">
        <span>Shortcuts: </span>
        <span className="px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-100/10 rounded">1-4</span>
        <span className="mx-1">for options</span>
        <span className="px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-100/10 rounded mx-1">N</span>
        <span>for next</span>
      </div>

      <HintDisplay hint={question.hint} isVisible={showHint} />
      <ExplanationDisplay explanation={question.explanation} isVisible={showExplanation} />
        </>
      )}

      {isAnswered && !isCorrect && !isExamMode && (
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

