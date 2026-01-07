'use client';

import { ChapterStats as ChapterStatsType } from '@/lib/types';
import { formatTime } from '@/lib/analytics';

interface ChapterStatsProps {
  topic: string;
  stats: ChapterStatsType;
}

export default function ChapterStats({ topic, stats }: ChapterStatsProps) {
  return (
    <div className="rounded p-5 border-b border-gray-100 dark:border-gray-800 pb-6">
      <h3 className="text-base font-semibold text-foreground mb-5">{topic}</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-5">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Total Questions</div>
          <div className="text-xl font-semibold text-foreground">{stats.totalQuestions}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Correct</div>
          <div className="text-xl font-semibold text-green-600 dark:text-green-400">{stats.correct}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Wrong</div>
          <div className="text-xl font-semibold text-red-600 dark:text-red-400">{stats.wrong}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Accuracy</div>
          <div className="text-xl font-semibold text-foreground">
            {stats.accuracy.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Avg Time/Question</div>
          <div className="text-xl font-semibold text-foreground">
            {formatTime(stats.averageTime)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Hints Used</div>
          <div className="text-xl font-semibold text-foreground">{stats.hintsUsed}</div>
        </div>
      </div>

      <div className="mt-5 pt-5">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mb-2">
          <span>Progress</span>
          <span>{stats.accuracy.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-100/30 dark:bg-gray-100/10 rounded-full h-1">
          <div
            className="bg-foreground h-1 rounded-full transition-[width]"
            style={{ width: `${stats.accuracy}%` }}
          />
        </div>
      </div>
    </div>
  );
}

