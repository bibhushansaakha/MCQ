'use client';

interface HintDisplayProps {
  hint: string;
  isVisible: boolean;
}

export default function HintDisplay({ hint, isVisible }: HintDisplayProps) {
  if (!isVisible) return null;

  return (
    <div className="mt-4 p-4 rounded-lg border border-gray-200/40 dark:border-gray-700/30 bg-transparent">
      <div className="text-sm font-medium text-foreground mb-1">Hint</div>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{hint}</p>
    </div>
  );
}

