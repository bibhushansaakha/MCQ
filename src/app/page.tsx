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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* High Priority Section */}
        <Link
          href="/priority"
          className="group mb-8 p-8 rounded-xl border-2 border-[#ea580c] bg-[#ea580c]/5 dark:bg-[#ea580c]/10 hover:bg-[#ea580c]/10 dark:hover:bg-[#ea580c]/20 transition-all hover:shadow-lg block"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#ea580c] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
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
              <div>
                <h2 className="text-2xl font-bold text-foreground group-hover:text-[#ea580c] transition-colors">
                  High Priority Questions
                </h2>
                <span className="text-xs font-semibold text-[#ea580c] bg-white dark:bg-gray-900 px-2 py-1 rounded">
                  PRIORITY
                </span>
              </div>
            </div>
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
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
            Practice with official model questions and past questions directly from NEC. 
            These are essential for exam preparation.
          </p>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-500">
            <li className="flex items-center gap-2">
              <span className="text-[#ea580c]">•</span>
              Official model questions from NEC
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#ea580c]">•</span>
              Past questions from previous exams
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#ea580c]">•</span>
              Quick test, full test, and random practice modes
            </li>
          </ul>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Learn with MCQ */}
          <Link
            href="/learn"
            className="group p-8 rounded-xl border-2 border-gray-200 dark:border-gray-800 hover:border-[#ea580c] dark:hover:border-[#ea580c] transition-all hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#ea580c]/10 dark:bg-[#ea580c]/20 flex items-center justify-center group-hover:bg-[#ea580c]/20 dark:group-hover:bg-[#ea580c]/30 transition-colors">
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
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
            <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-[#ea580c] transition-colors">
              Learn with MCQ
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Study questions chapter by chapter with detailed explanations.
              Perfect for learning concepts and understanding the reasoning
              behind each answer.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-500">
              <li className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                Questions shown in order
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                Explanations always available
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                Navigate between chapters easily
              </li>
            </ul>
          </Link>

          {/* Practice Past Questions */}
          <Link
            href="/practice"
            className="group p-8 rounded-xl border-2 border-gray-200 dark:border-gray-800 hover:border-[#ea580c] dark:hover:border-[#ea580c] transition-all hover:shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#ea580c]/10 dark:bg-[#ea580c]/20 flex items-center justify-center group-hover:bg-[#ea580c]/20 dark:group-hover:bg-[#ea580c]/30 transition-colors">
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
            <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-[#ea580c] transition-colors">
              Practice Past Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Test your knowledge with chapter-wise practice, quick tests, and
              full-length exam simulations. Perfect for exam preparation and
              self-assessment.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-500 dark:text-gray-500">
              <li className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                Chapter-wise practice
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                Quick test (25 questions)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ea580c]">•</span>
                Full test (100 questions)
              </li>
            </ul>
          </Link>
        </div>
      </div>
    </main>
  );
}
