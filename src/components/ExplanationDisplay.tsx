'use client';

interface ExplanationDisplayProps {
  explanation: string;
  isVisible: boolean;
}

export default function ExplanationDisplay({ explanation, isVisible }: ExplanationDisplayProps) {
  if (!isVisible) return null;

  return (
    <div className="mt-4 p-4 rounded-lg border border-gray-200/40 dark:border-gray-700/30 bg-transparent">
      <div className="text-sm font-medium text-foreground mb-1">Explanation</div>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{explanation}</p>
    </div>
  );
}

