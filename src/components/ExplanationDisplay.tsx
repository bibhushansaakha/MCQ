'use client';

interface ExplanationDisplayProps {
  explanation: string;
  isVisible: boolean;
}

export default function ExplanationDisplay({ explanation, isVisible }: ExplanationDisplayProps) {
  if (!isVisible) return null;

  return (
    <div className="mt-4 p-4 rounded border-l-2 border-gray-300 dark:border-gray-700">
      <div className="text-sm font-medium text-foreground mb-1">Explanation</div>
      <p className="text-sm text-gray-600 dark:text-gray-500 leading-relaxed">{explanation}</p>
    </div>
  );
}

