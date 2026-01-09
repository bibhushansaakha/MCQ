'use client';

import { useState } from 'react';
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Always visible */}
            <Logo />
            
            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center gap-4">
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

            {/* Mobile Menu Button - Only visible on mobile, completely hidden on desktop */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="block lg:hidden p-2 text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 active:bg-gray-50/25 dark:active:bg-gray-800/20 rounded-lg transition-colors touch-manipulation"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Only on mobile */}
      {showMobileMenu && (
        <div 
          className="block lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setShowMobileMenu(false)}
          onTouchStart={() => setShowMobileMenu(false)}
        />
      )}

      {/* Mobile Menu Drawer - Slides in from right, only on mobile */}
      <div className={`block lg:hidden fixed inset-y-0 right-0 z-50 w-80 bg-background border-l border-gray-200 dark:border-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${
        showMobileMenu ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full overflow-y-auto p-6">
          {/* Close Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-2 text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Stats - Mobile */}
          {stats && !isExamMode && (
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
              <HeaderStats
                correct={stats.correct}
                total={stats.total}
                timeElapsed={stats.timeElapsed}
                hintsUsed={stats.hintsUsed}
              />
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setShowMobileMenu(false)}
              className="px-4 py-3 text-base text-gray-500 dark:text-gray-500 hover:text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              href="/history"
              onClick={() => setShowMobileMenu(false)}
              className="px-4 py-3 text-base text-gray-500 dark:text-gray-500 hover:text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 rounded-lg transition-colors"
            >
              Attempts
            </Link>
            <Link
              href="/analytics"
              onClick={() => setShowMobileMenu(false)}
              className="px-4 py-3 text-base text-gray-500 dark:text-gray-500 hover:text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 rounded-lg transition-colors"
            >
              Performance
            </Link>
            <Link
              href="/admin/upload"
              onClick={() => setShowMobileMenu(false)}
              className="px-4 py-3 text-base text-gray-500 dark:text-gray-500 hover:text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 rounded-lg transition-colors"
            >
              Upload
            </Link>
            <Link
              href="/about"
              onClick={() => setShowMobileMenu(false)}
              className="px-4 py-3 text-base text-gray-500 dark:text-gray-500 hover:text-foreground hover:bg-gray-50/15 dark:hover:bg-gray-800/10 rounded-lg transition-colors"
            >
              About
            </Link>
            
            {/* Theme Toggle - Mobile */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 mt-4 pt-4">
              <ThemeToggleWrapper />
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}

