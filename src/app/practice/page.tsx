"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ModeSelector from "@/components/ModeSelector";
import { Topic } from "@/lib/types";

export default function PracticePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load topics on client side
  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        setTopics(data);
        setIsLoading(false);
      })
      .catch(() => {
        setTopics([]);
        setIsLoading(false);
      });
  }, []);

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
              Practice Past Questions
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Test your knowledge with various practice modes. Choose from chapter-wise practice, quick tests, or full-length exam simulations to prepare for your Nepal Engineering Council exam.
            </p>
            <div className="mb-8">
              <h2 className="font-semibold text-foreground mb-2">Available Modes:</h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] mt-1">•</span>
                  <span><strong>Chapter Practice:</strong> Practice questions from specific chapters with hints and explanations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] mt-1">•</span>
                  <span><strong>Quick Test:</strong> 25 questions in 30 minutes from all chapters - perfect for quick practice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ea580c] mt-1">•</span>
                  <span><strong>Full Test:</strong> 100 questions in 2 hours - complete exam simulation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-800 border-t-foreground mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              Loading practice modes...
            </p>
          </div>
        ) : (
          <ModeSelector topics={topics} />
        )}
      </div>
    </main>
  );
}

