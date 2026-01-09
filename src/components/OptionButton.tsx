'use client';

interface OptionButtonProps {
  option: string;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isAnswered: boolean;
  onClick: () => void;
}

export default function OptionButton({
  option,
  isSelected,
  isCorrect,
  isWrong,
  isAnswered,
  onClick,
}: OptionButtonProps) {
  let buttonClass = 'w-full p-2 md:p-3 text-sm md:text-base text-left rounded transition-colors ';
  
  if (isAnswered) {
    if (isCorrect) {
      buttonClass += 'bg-transparent border border-green-500 dark:border-green-400 text-green-600 dark:text-green-400';
    } else if (isWrong) {
      buttonClass += 'bg-transparent border border-red-500 dark:border-red-400 text-red-600 dark:text-red-400';
    } else {
      buttonClass += 'bg-transparent border border-gray-200/40 dark:border-gray-700/30 text-gray-400 dark:text-gray-600';
    }
  } else if (isSelected) {
    buttonClass += 'bg-transparent border-l-2 border-foreground text-foreground';
  } else {
    buttonClass += 'bg-transparent text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 cursor-pointer border border-gray-200/40 dark:border-gray-700/30';
  }

  return (
    <button
      onClick={onClick}
      disabled={isAnswered}
      className={`${buttonClass} touch-manipulation active:scale-[0.98] transition-transform`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={isAnswered ? -1 : 0}
      aria-label={`Option: ${option}`}
    >
      {option}
    </button>
  );
}

