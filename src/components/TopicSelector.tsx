'use client';

import Link from 'next/link';
import { Topic } from '@/lib/types';

interface TopicSelectorProps {
  topics: Topic[];
}

export default function TopicSelector({ topics }: TopicSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {topics.map((topic) => (
        <Link
          key={topic.id}
          href={`/quiz/${topic.id}`}
          className="block p-4 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10 group"
        >
          <h2 className="text-base font-semibold text-foreground mb-1 group-hover:text-foreground">
            {topic.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {topic.description}
          </p>
        </Link>
      ))}
    </div>
  );
}

