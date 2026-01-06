'use client';

import { formatTime } from '@/lib/analytics';

interface SessionStatsProps {
  correct: number;
  total: number;
  timeElapsed: number;
  hintsUsed: number;
}

export default function SessionStats({ correct, total, timeElapsed, hintsUsed }: SessionStatsProps) {
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';
  
  return (
    <div className="pb-6 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <div className="text-2xl font-semibold text-foreground">{correct}/{total}</div>
          <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Score</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-foreground">{accuracy}%</div>
          <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Accuracy</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-foreground">{formatTime(timeElapsed)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Time</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-foreground">{hintsUsed}</div>
          <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Hints Used</div>
        </div>
      </div>
    </div>
  );
}

