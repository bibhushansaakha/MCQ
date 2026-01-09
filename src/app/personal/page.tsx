"use client";

import { useRouter } from "next/navigation";
import { ExamMode } from "@/lib/types";
import Link from "next/link";

export default function PersonalPage() {
  const router = useRouter();

  const handleModeSelect = (mode: ExamMode) => {
    router.push(`/quiz/exam/${mode}`);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
                Personal Exam Questions
              </h1>
              <span className="px-3 py-1 text-sm font-semibold bg-[#ea580c] text-white rounded-full">
                HIGHEST PRIORITY
              </span>
            </div>
            <p className="text-lg text-gray-500 dark:text-gray-500 mb-4 leading-relaxed">
              55 questions remembered from the actual NEC exam I just took
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-400">
              These are the most important questions - directly from the actual exam experience
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {/* Personal Exam Questions Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#ea580c]/10 dark:bg-[#ea580c]/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#ea580c]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-semibold text-foreground">
                Personal Exam Questions
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              55 questions that I remembered from the actual NEC exam I just took. The questions are accurate with correct answers, though the options may not be perfectly accurate.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/quiz/learn/personal")}
                className="p-6 rounded-lg border-2 border-gray-200/40 dark:border-gray-700/30 hover:border-[#ea580c] hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-[#ea580c] transition-colors">
                    Learn Mode
                  </h3>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-[#ea580c] transition-colors"
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
                  <span className="font-medium text-foreground">All 55 questions</span>{" "}
                  in order
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  One by one with explanations
                </p>
              </button>

              <button
                onClick={() => handleModeSelect("personal-quick-test")}
                className="p-6 rounded-lg border-2 border-gray-200/40 dark:border-gray-700/30 hover:border-[#ea580c] hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-[#ea580c] transition-colors">
                    Quick Test
                  </h3>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-[#ea580c] transition-colors"
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
                  Personal exam questions
                </p>
              </button>

              <button
                onClick={() => handleModeSelect("personal-full-test")}
                className="p-6 rounded-lg border-2 border-gray-200/40 dark:border-gray-700/30 hover:border-[#ea580c] hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-[#ea580c] transition-colors">
                    Full Test
                  </h3>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-[#ea580c] transition-colors"
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
                  <span className="font-medium text-foreground">55 questions</span>{" "}
                  in 2 hours
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Complete personal exam simulation
                </p>
              </button>

              <button
                onClick={() => handleModeSelect("personal-random")}
                className="p-6 rounded-lg border-2 border-gray-200/40 dark:border-gray-700/30 hover:border-[#ea580c] hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-[#ea580c] transition-colors">
                    Random Practice
                  </h3>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-[#ea580c] transition-colors"
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
                  <span className="font-medium text-foreground">55 random questions</span>{" "}
                  in 1 hour
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Random selection from personal questions
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
