'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseExamTimerOptions {
  timeLimit: number; // milliseconds
  onTimeExpired: () => void;
}

export function useExamTimer({ timeLimit, onTimeExpired }: UseExamTimerOptions) {
  const [remainingTime, setRemainingTime] = useState(timeLimit);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeExpiredRef = useRef(onTimeExpired);

  // Update callback ref when it changes
  useEffect(() => {
    onTimeExpiredRef.current = onTimeExpired;
  }, [onTimeExpired]);

  useEffect(() => {
    if (isRunning && remainingTime > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            setIsRunning(false);
            onTimeExpiredRef.current();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, remainingTime]);

  // Handle page visibility changes - timer continues even when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, but timer continues
        // We'll recalculate remaining time when tab becomes visible again
      } else {
        // Tab is visible again, recalculate remaining time based on elapsed time
        if (startTimeRef.current && isRunning) {
          const elapsed = Date.now() - startTimeRef.current;
          const newRemaining = Math.max(0, timeLimit - elapsed);
          setRemainingTime(newRemaining);
          if (newRemaining <= 0) {
            setIsRunning(false);
            onTimeExpiredRef.current();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, timeLimit]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setRemainingTime(timeLimit);
    setIsRunning(true);
  }, [timeLimit]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    remainingTime,
    formattedTime: formatTime(remainingTime),
    isRunning,
    start,
    stop,
  };
}

