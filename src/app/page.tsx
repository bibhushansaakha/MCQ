import ModeSelector from '@/components/ModeSelector';
import { loadTopicsServer } from '@/lib/questionUtils.server';

export default async function Home() {
  const topics = await loadTopicsServer();

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ModeSelector topics={topics} />
      </div>
    </main>
  );
}
