'use client';

import { useState } from 'react';

export interface FilterOptions {
  chapters: string[];
  difficulties: ('easy' | 'difficult')[];
  sources: string[];
}

interface QuestionFiltersProps {
  availableChapters: string[];
  availableDifficulties: ('easy' | 'difficult')[];
  availableSources: string[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export default function QuestionFilters({
  availableChapters,
  availableDifficulties,
  availableSources,
  filters,
  onFiltersChange,
}: QuestionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleChapter = (chapter: string) => {
    const newChapters = filters.chapters.includes(chapter)
      ? filters.chapters.filter(c => c !== chapter)
      : [...filters.chapters, chapter];
    updateFilters('chapters', newChapters);
  };

  const toggleDifficulty = (difficulty: 'easy' | 'difficult') => {
    const newDifficulties = filters.difficulties.includes(difficulty)
      ? filters.difficulties.filter(d => d !== difficulty)
      : [...filters.difficulties, difficulty];
    updateFilters('difficulties', newDifficulties);
  };

  const toggleSource = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source];
    updateFilters('sources', newSources);
  };

  const clearAll = () => {
    onFiltersChange({
      chapters: [],
      difficulties: [],
      sources: [],
    });
  };

  const hasActiveFilters = 
    filters.chapters.length > 0 || 
    filters.difficulties.length > 0 || 
    filters.sources.length > 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500 hover:text-foreground"
        >
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-foreground text-background rounded">
              {filters.chapters.length + filters.difficulties.length + filters.sources.length}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 dark:text-gray-500 hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4 p-4 rounded border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-100/5">
          {/* Difficulty Filter */}
          {availableDifficulties.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2 block">
                Difficulty
              </label>
              <div className="flex gap-2">
                {availableDifficulties.map(diff => (
                  <button
                    key={diff}
                    onClick={() => toggleDifficulty(diff)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      filters.difficulties.includes(diff)
                        ? diff === 'easy'
                          ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-500'
                          : 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-500'
                        : 'bg-gray-100/50 dark:bg-gray-100/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-100/20'
                    }`}
                  >
                    {diff === 'easy' ? 'Easy' : 'Difficult'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chapter Filter */}
          {availableChapters.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2 block">
                Chapters
              </label>
              <div className="flex flex-wrap gap-2">
                {availableChapters.map(chapter => (
                  <button
                    key={chapter}
                    onClick={() => toggleChapter(chapter)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      filters.chapters.includes(chapter)
                        ? 'bg-foreground text-background'
                        : 'bg-gray-100/50 dark:bg-gray-100/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-100/20'
                    }`}
                  >
                    {chapter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Source Filter */}
          {availableSources.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2 block">
                Source
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSources.map(source => (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      filters.sources.includes(source)
                        ? 'bg-foreground text-background'
                        : 'bg-gray-100/50 dark:bg-gray-100/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-100/20'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



