"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExamMode } from "@/lib/types";
import EnhancedTopicSelector from "./EnhancedTopicSelector";
import { Topic } from "@/lib/types";

interface ModeSelectorProps {
  topics: Topic[];
}

export default function ModeSelector({ topics }: ModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<ExamMode | null>(null);
  const router = useRouter();

  const handleModeSelect = (mode: ExamMode) => {
    setSelectedMode(mode);
    if (mode === "quick-test" || mode === "full-test" || 
        mode === "official-quick-test" || mode === "official-full-test" || mode === "official-random" ||
        mode === "past-quick-test" || mode === "past-full-test" || mode === "past-random" ||
        mode === "personal-quick-test" || mode === "personal-full-test" || mode === "personal-random") {
      router.push(`/quiz/exam/${mode}`);
    }
  };

  return (
    <div className="space-y-12">
      {/* Chapter Practice */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Chapter Practice
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          Practice questions from specific chapters with hints and explanations.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {topics
            .filter((topic) => {
              if (!topic.id.startsWith("chapter-")) return false;
              const match = topic.id.match(/chapter-(\d+)/);
              if (!match) return false;
              const chapterNum = parseInt(match[1], 10);
              return chapterNum >= 1 && chapterNum <= 10;
            })
            .sort((a, b) => {
              const aMatch = a.id.match(/chapter-(\d+)/);
              const bMatch = b.id.match(/chapter-(\d+)/);
              if (aMatch && bMatch) {
                return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
              }
              return 0;
            })
            .map((topic) => {
              const match = topic.id.match(/chapter-(\d+)/);
              const chapterNum = match ? parseInt(match[1], 10).toString() : "";
              return (
                <button
                  key={topic.id}
                  onClick={() => router.push(`/quiz/${topic.id}`)}
                  className="p-4 rounded-lg border border-gray-200/40 dark:border-gray-700/30 hover:border-[#ea580c] hover:shadow-sm transition-all text-center"
                >
                  <div className="text-lg font-semibold text-foreground mb-1">
                    Chapter {chapterNum}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Practice
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Exam Modes */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Test Modes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleModeSelect("quick-test")}
            className={`p-6 rounded-lg border text-left transition-all ${
              selectedMode === "quick-test"
                ? "border-foreground bg-foreground/5 shadow-sm"
                : "border-gray-200/40 dark:border-gray-700/30 hover:border-foreground/50 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold text-foreground">
                Quick Test
              </h3>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
              <span className="font-medium text-foreground">25 questions</span>{" "}
              in 30 minutes
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Mixed questions from all chapters
            </p>
          </button>

          <button
            onClick={() => handleModeSelect("full-test")}
            className={`p-6 rounded-lg border text-left transition-all ${
              selectedMode === "full-test"
                ? "border-foreground bg-foreground/5 shadow-sm"
                : "border-gray-200/40 dark:border-gray-700/30 hover:border-foreground/50 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold text-foreground">
                Full Test
              </h3>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
              <span className="font-medium text-foreground">100 questions</span>{" "}
              in 2 hours
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Complete exam simulation
            </p>
          </button>
        </div>
      </div>

      {/* Chapter Selection */}
      {selectedMode === "chapterwise" && (
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Select Chapter
          </h2>
          <EnhancedTopicSelector
            topics={topics
              .filter((topic) => {
                if (!topic.id.startsWith("chapter-")) return false;
                // Only show chapters 1-10
                const match = topic.id.match(/chapter-(\d+)/);
                if (!match) return false;
                const chapterNum = parseInt(match[1], 10);
                return chapterNum >= 1 && chapterNum <= 10;
              })
              .sort((a, b) => {
                // Sort chapters numerically
                const aMatch = a.id.match(/chapter-(\d+)/);
                const bMatch = b.id.match(/chapter-(\d+)/);
                if (aMatch && bMatch) {
                  return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
                }
                return 0;
              })}
            chapterMode={true}
          />
        </div>
      )}
    </div>
  );
}
