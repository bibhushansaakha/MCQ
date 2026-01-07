'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Topic } from '@/lib/types';
import QuestionFilters, { FilterOptions } from './QuestionFilters';

interface EnhancedTopicSelectorProps {
  topics: Topic[];
  chapterMode?: boolean;
}

export default function EnhancedTopicSelector({ topics, chapterMode = false }: EnhancedTopicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    chapters: [],
    difficulties: [],
    sources: [],
  });
  const [metadata, setMetadata] = useState<{
    chapters: string[];
    difficulties: ('easy' | 'difficult')[];
    sources: string[];
  } | null>(null);
  const [topicStats, setTopicStats] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [metadataRes, statsRes] = await Promise.all([
          fetch('/api/questions/metadata'),
          fetch('/api/topics/stats'),
        ]);
        
        if (metadataRes.ok) {
          const data = await metadataRes.json();
          setMetadata(data);
        }
        
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setTopicStats(stats);
        }
      } catch (error) {
        console.error('Error loading metadata:', error);
      }
    }
    loadMetadata();
  }, []);

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = 
      !searchQuery || 
      topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded border border-gray-200 dark:border-gray-800 bg-background text-foreground placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      {/* Filters */}
      {metadata && (
        <QuestionFilters
          availableChapters={metadata.chapters}
          availableDifficulties={metadata.difficulties}
          availableSources={metadata.sources}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Topic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTopics.map((topic) => {
          // In chapter mode, automatically filter by chapter matching the topic
          const chapterFilter = chapterMode ? topic.id : null;
          const hasFilters = filters.chapters.length > 0 || filters.difficulties.length > 0 || filters.sources.length > 0 || chapterFilter !== null;
          const queryParams = hasFilters 
            ? `?${chapterFilter ? `chapters=${encodeURIComponent(chapterFilter)}` : filters.chapters.length > 0 ? `chapters=${encodeURIComponent(filters.chapters.join(','))}` : ''}${filters.difficulties.length > 0 ? `${(chapterFilter || filters.chapters.length > 0) ? '&' : ''}difficulties=${encodeURIComponent(filters.difficulties.join(','))}` : ''}${filters.sources.length > 0 ? `${(chapterFilter || filters.chapters.length > 0 || filters.difficulties.length > 0) ? '&' : ''}sources=${encodeURIComponent(filters.sources.join(','))}` : ''}`
            : '';
          
          return (
          <Link
            key={topic.id}
            href={`/quiz/${topic.id}${queryParams}`}
            className="block p-4 rounded border border-gray-200 dark:border-gray-800 hover:border-foreground/50 hover:bg-gray-50/15 dark:hover:bg-gray-800/10 transition-colors group"
          >
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-base font-semibold text-foreground group-hover:text-foreground">
                {topic.name}
              </h2>
              {topicStats[topic.id] !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-500 ml-2 whitespace-nowrap">
                  {topicStats[topic.id]} Q
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
              {topic.description}
            </p>
            {hasFilters && (
              <div className="mt-2 flex flex-wrap gap-1">
                {filters.chapters.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-100/10 rounded text-gray-600 dark:text-gray-400">
                    {filters.chapters.length} chapter{filters.chapters.length > 1 ? 's' : ''}
                  </span>
                )}
                {filters.difficulties.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-100/10 rounded text-gray-600 dark:text-gray-400">
                    {filters.difficulties.join(', ')}
                  </span>
                )}
                {filters.sources.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100/50 dark:bg-gray-100/10 rounded text-gray-600 dark:text-gray-400">
                    {filters.sources.length} source{filters.sources.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </Link>
        )})}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            No topics found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}

