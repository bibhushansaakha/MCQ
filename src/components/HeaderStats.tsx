'use client';

import { useState, useRef, useEffect } from 'react';
import { formatTime } from '@/lib/analytics';

interface HeaderStatsProps {
  correct: number;
  total: number;
  timeElapsed: number;
  hintsUsed: number;
}

export default function HeaderStats({ correct, total, timeElapsed, hintsUsed }: HeaderStatsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (total === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground transition-colors rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10"
      >
        <span className="font-medium">{correct}/{total}</span>
        <span className="text-xs">({accuracy}%)</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-500">Score</span>
              <span className="text-sm font-semibold text-foreground">{correct}/{total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-500">Accuracy</span>
              <span className="text-sm font-semibold text-foreground">{accuracy}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-500">Time</span>
              <span className="text-sm font-semibold text-foreground">{formatTime(timeElapsed)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-500">Hints Used</span>
              <span className="text-sm font-semibold text-foreground">{hintsUsed}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



