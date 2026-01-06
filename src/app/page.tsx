import TopicSelector from '@/components/TopicSelector';
import { loadTopicsServer } from '@/lib/questionUtils.server';
import Link from 'next/link';
import ThemeToggleWrapper from '@/components/ThemeToggleWrapper';

export default async function Home() {
  const topics = await loadTopicsServer();

  return (
    <main className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-4xl font-semibold text-foreground mb-3">
                NEC Exam Preparation
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-500 mb-6">
                Practice MCQ questions for Nepal Engineering Council exam
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/history"
                className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
              >
                History
              </Link>
              <Link
                href="/analytics"
                className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
              >
                Analytics
              </Link>
              <ThemeToggleWrapper />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Select a Topic
          </h2>
          <TopicSelector topics={topics} />
        </div>
      </div>
    </main>
  );
}

