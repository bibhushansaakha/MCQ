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
  let buttonClass = 'w-full p-3 text-left rounded transition-colors ';
  
  if (isAnswered) {
    if (isCorrect) {
      buttonClass += 'bg-green-600 dark:bg-green-600 text-white border-2 border-green-600';
    } else if (isWrong) {
      buttonClass += 'bg-transparent border-2 border-red-600 text-foreground';
    } else {
      buttonClass += 'bg-transparent text-gray-400 dark:text-gray-600';
    }
  } else if (isSelected) {
    buttonClass += 'bg-transparent border-l-2 border-foreground text-foreground';
  } else {
    buttonClass += 'bg-transparent text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 cursor-pointer';
  }

  return (
    <button
      onClick={onClick}
      disabled={isAnswered}
      className={buttonClass}
    >
      {option}
    </button>
  );
}

