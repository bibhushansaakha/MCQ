'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface QuizStats {
  correct: number;
  total: number;
  timeElapsed: number;
  hintsUsed: number;
}

interface QuizStatsContextType {
  stats: QuizStats | null;
  setStats: (stats: QuizStats | null) => void;
}

const QuizStatsContext = createContext<QuizStatsContextType | undefined>(undefined);

export function QuizStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<QuizStats | null>(null);

  return (
    <QuizStatsContext.Provider value={{ stats, setStats }}>
      {children}
    </QuizStatsContext.Provider>
  );
}

export function useQuizStats() {
  const context = useContext(QuizStatsContext);
  if (context === undefined) {
    throw new Error('useQuizStats must be used within a QuizStatsProvider');
  }
  return context;
}



