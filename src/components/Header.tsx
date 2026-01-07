'use client';

import Logo from './Logo';
import Link from 'next/link';
import ThemeToggleWrapper from './ThemeToggleWrapper';
import HeaderStats from './HeaderStats';
import { useQuizStats } from '@/contexts/QuizStatsContext';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { stats } = useQuizStats();
  const pathname = usePathname();
  const isExamMode = pathname?.includes('/quiz/exam/');

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <nav className="flex items-center gap-4">
            {stats && !isExamMode && (
              <HeaderStats
                correct={stats.correct}
                total={stats.total}
                timeElapsed={stats.timeElapsed}
                hintsUsed={stats.hintsUsed}
              />
            )}
            <Link
              href="/"
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/history"
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground transition-colors"
            >
              Attempts
            </Link>
            <Link
              href="/analytics"
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground transition-colors"
            >
              Performance
            </Link>
            <Link
              href="/admin/upload"
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground transition-colors"
            >
              Upload
            </Link>
            <Link
              href="/about"
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground transition-colors"
            >
              About
            </Link>
            <ThemeToggleWrapper />
          </nav>
        </div>
      </div>
    </header>
  );
}

