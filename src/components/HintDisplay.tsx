'use client';

interface HintDisplayProps {
  hint: string;
  isVisible: boolean;
}

export default function HintDisplay({ hint, isVisible }: HintDisplayProps) {
  if (!isVisible) return null;

  return (
    <div className="mt-4 p-4 rounded border-l-2 border-gray-300 dark:border-gray-700">
      <div className="text-sm font-medium text-foreground mb-1">Hint</div>
      <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed">{hint}</p>
    </div>
  );
}

