"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LearnPage() {
  const router = useRouter();
  const availableChapters = [1, 2, 3, 4, 5, 6, 8, 9, 10];

  const handleChapterSelect = (chapter: number) => {
    router.push(`/quiz/learn/${chapter}`);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-gray-500 hover:text-foreground mb-6 inline-block"
          >
            ← Back to Home
          </Link>
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Learn with MCQ
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Study questions chapter by chapter with detailed explanations. This mode is perfect for learning concepts and understanding the reasoning behind each answer.
            </p>
            <div className="mb-8">
              <h2 className="font-semibold text-foreground mb-2">How it works:</h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] mt-1">•</span>
                  <span>Questions are displayed in order (not randomized)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] mt-1">•</span>
                  <span>Explanations are always shown after answering, even if correct</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] mt-1">•</span>
                  <span>Navigate between questions and chapters easily</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] mt-1">•</span>
                  <span>Jump to any question using the question navigation sidebar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] mt-1">•</span>
                  <span>Switch between chapters without losing your progress</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Selection */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Select a Chapter
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {availableChapters.map((chapter) => (
            <button
              key={chapter}
              onClick={() => handleChapterSelect(chapter)}
              className="p-4 rounded-lg border border-gray-200/40 dark:border-gray-700/30 hover:border-[#ea580c] hover:shadow-sm transition-all text-center"
            >
              <div className="text-lg font-semibold text-foreground mb-1">
                Chapter {chapter}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Learn Mode
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

