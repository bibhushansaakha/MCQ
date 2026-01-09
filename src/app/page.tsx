import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Kati <span className="text-[#ea580c]">Sajilo</span>
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-500 mb-8 leading-relaxed">
              Master Nepal Engineering Council exam with smart MCQ practice
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500 dark:text-gray-500">
              <span>• No login required</span>
              <span>• Instant feedback</span>
              <span>• Track your progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Exam Questions - TOP LEFT - HIGHLIGHTED */}
          <Link
            href="/personal"
            className="group p-6 rounded-xl border-2 border-[#ea580c] bg-[#ea580c]/10 dark:bg-[#ea580c]/20 hover:bg-[#ea580c]/15 dark:hover:bg-[#ea580c]/25 transition-all hover:shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-[#ea580c] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              HIGHEST PRIORITY
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#ea580c] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
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
              <h2 className="text-xl font-bold text-foreground group-hover:text-[#ea580c] transition-colors">
                Personal Exam Questions
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              55 questions from the actual NEC exam I just took. Practice with Learn Mode or Full Test.
            </p>
            <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                <span><strong>Learn Mode:</strong> Study all 55 questions with explanations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                <span><strong>Full Test:</strong> Complete 55-question exam simulation</span>
              </div>
            </div>
          </Link>

          {/* High Priority Questions - TOP RIGHT */}
          <Link
            href="/priority"
            className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-800 hover:border-[#ea580c] dark:hover:border-[#ea580c] transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#ea580c]/10 dark:bg-[#ea580c]/20 flex items-center justify-center group-hover:bg-[#ea580c]/20 dark:group-hover:bg-[#ea580c]/30 transition-colors">
                <svg
                  className="w-5 h-5 text-[#ea580c]"
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
              <h2 className="text-xl font-bold text-foreground group-hover:text-[#ea580c] transition-colors">
                High Priority Questions
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Official model questions and past questions from NEC. Essential for exam preparation.
            </p>
            <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                <span><strong>Learn Mode:</strong> Study all questions with explanations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                <span><strong>Full Test:</strong> Complete 100-question exam simulation</span>
              </div>
            </div>
          </Link>

          {/* Learn with MCQ - BOTTOM LEFT */}
          <Link
            href="/learn"
            className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-800 hover:border-[#ea580c] dark:hover:border-[#ea580c] transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#ea580c]/10 dark:bg-[#ea580c]/20 flex items-center justify-center group-hover:bg-[#ea580c]/20 dark:group-hover:bg-[#ea580c]/30 transition-colors">
                <svg
                  className="w-5 h-5 text-[#ea580c]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground group-hover:text-[#ea580c] transition-colors">
                Learn with MCQ
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Study questions chapter by chapter. Perfect for learning concepts step by step.
            </p>
            <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                <span>Questions shown in order by chapter</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                <span>Detailed explanations for each answer</span>
              </div>
            </div>
          </Link>

          {/* Practice Past Questions - BOTTOM RIGHT */}
          <Link
            href="/practice"
            className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-800 hover:border-[#ea580c] dark:hover:border-[#ea580c] transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#ea580c]/10 dark:bg-[#ea580c]/20 flex items-center justify-center group-hover:bg-[#ea580c]/20 dark:group-hover:bg-[#ea580c]/30 transition-colors">
                <svg
                  className="w-5 h-5 text-[#ea580c]"
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
              <h2 className="text-xl font-bold text-foreground group-hover:text-[#ea580c] transition-colors">
                Practice Past Questions
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Practice by chapter or take full-length tests. Test your knowledge and track progress.
            </p>
            <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                <span>Chapter-wise practice with hints</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                <span>Full test (100 questions in 2 hours)</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
