'use client';

import { useEffect, useState } from 'react';
import { 
  getAnalyticsData, 
  formatTime, 
  getTimeDistribution, 
  getPerformanceTrends,
  getQuestionDifficulty,
  getBestWorstTopics,
  getImprovementRate,
  getHintsUsageTrends,
  getChapterComparison,
  getDailyActivity
} from '@/lib/analytics';
import {
  filterSessionsByMode,
  filterSessionsByExamMode,
  calculateStatsForSessions,
  calculateChapterStatsForSessions,
  getPerformanceInsights,
  getModeSpecificInsights,
  getFocusRecommendations,
  PerformanceInsight,
  FocusRecommendation
} from '@/lib/analyticsUtils';
import { AnalyticsData, ExamMode } from '@/lib/types';
import AnalyticsChart from '@/components/AnalyticsChart';
import ChapterStats from '@/components/ChapterStats';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'learn' | 'practice'>('overview');
  const [activePracticeMode, setActivePracticeMode] = useState<ExamMode | 'all'>('all');
  const isDark = useDarkMode();

  useEffect(() => {
    async function loadAnalytics() {
      const data = await getAnalyticsData();
      setAnalytics(data);
    }
    loadAnalytics();
  }, []);

  // Chart colors
  const barColor = '#ea580c';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const successColor = '#10b981';
  const warningColor = '#f59e0b';
  const dangerColor = '#ef4444';

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-800 border-t-foreground mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const { sessions } = analytics;
  
  // Filter sessions by mode
  const learnSessions = filterSessionsByMode(sessions, 'learn');
  const practiceSessions = filterSessionsByMode(sessions, 'practice');
  
  // Filter practice sessions by exam mode
  const chapterwiseSessions = filterSessionsByExamMode(practiceSessions, 'chapterwise');
  const quickTestSessions = filterSessionsByExamMode(practiceSessions, 'quick-test');
  const fullTestSessions = filterSessionsByExamMode(practiceSessions, 'full-test');
  const officialQuickTestSessions = filterSessionsByExamMode(practiceSessions, 'official-quick-test');
  const officialFullTestSessions = filterSessionsByExamMode(practiceSessions, 'official-full-test');
  const pastQuickTestSessions = filterSessionsByExamMode(practiceSessions, 'past-quick-test');
  const pastFullTestSessions = filterSessionsByExamMode(practiceSessions, 'past-full-test');
  
  // Calculate stats for each mode
  const overallStats = calculateStatsForSessions(sessions);
  const learnStats = calculateStatsForSessions(learnSessions);
  const practiceStats = calculateStatsForSessions(practiceSessions);
  const chapterwiseStats = calculateStatsForSessions(chapterwiseSessions);
  const quickTestStats = calculateStatsForSessions(quickTestSessions);
  const fullTestStats = calculateStatsForSessions(fullTestSessions);
  const officialQuickTestStats = calculateStatsForSessions(officialQuickTestSessions);
  const officialFullTestStats = calculateStatsForSessions(officialFullTestSessions);
  const pastQuickTestStats = calculateStatsForSessions(pastQuickTestSessions);
  const pastFullTestStats = calculateStatsForSessions(pastFullTestSessions);
  
  // Calculate chapter stats
  const allChapterStats = calculateChapterStatsForSessions(sessions);
  const learnChapterStats = calculateChapterStatsForSessions(learnSessions);
  const practiceChapterStats = calculateChapterStatsForSessions(practiceSessions);
  
  // Get insights
  const overallInsights = getPerformanceInsights(sessions, allChapterStats);
  const learnInsights = getModeSpecificInsights(learnSessions, 'learn');
  const practiceInsights = getModeSpecificInsights(practiceSessions, 'practice');
  const chapterwiseInsights = getModeSpecificInsights(chapterwiseSessions, 'practice', 'chapterwise');
  const quickTestInsights = getModeSpecificInsights(quickTestSessions, 'practice', 'quick-test');
  const fullTestInsights = getModeSpecificInsights(fullTestSessions, 'practice', 'full-test');
  const officialQuickTestInsights = getModeSpecificInsights(officialQuickTestSessions, 'practice', 'official-quick-test');
  const officialFullTestInsights = getModeSpecificInsights(officialFullTestSessions, 'practice', 'official-full-test');
  const pastQuickTestInsights = getModeSpecificInsights(pastQuickTestSessions, 'practice', 'past-quick-test');
  const pastFullTestInsights = getModeSpecificInsights(pastFullTestSessions, 'practice', 'past-full-test');
  
  // Get focus recommendations
  const focusRecommendations = getFocusRecommendations(allChapterStats);
  
  // Helper function to render stats card
  const renderStatsCard = (label: string, value: string | number, color?: string) => (
    <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-800">
      <div className="text-xs text-gray-600 dark:text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${color || 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
  
  // Helper function to render insights
  const renderInsights = (insights: PerformanceInsight[]) => {
    if (insights.length === 0) return null;
    
    return (
      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const borderColor = 
            insight.type === 'strength' ? 'border-green-500 dark:border-green-600' :
            insight.type === 'weakness' ? 'border-red-500 dark:border-red-600' :
            insight.type === 'improvement' ? 'border-blue-500 dark:border-blue-600' :
            'border-yellow-500 dark:border-yellow-600';
          
          const iconColor =
            insight.type === 'strength' ? 'text-green-600 dark:text-green-400' :
            insight.type === 'weakness' ? 'text-red-600 dark:text-red-400' :
            insight.type === 'improvement' ? 'text-blue-600 dark:text-blue-400' :
            'text-yellow-600 dark:text-yellow-400';
          
          return (
            <div key={idx} className={`p-4 rounded-lg border-l-4 ${borderColor} bg-background`}>
              <div className="flex items-start gap-3">
                <div className={`text-xl ${iconColor}`}>
                  {insight.type === 'strength' ? '✓' :
                   insight.type === 'weakness' ? '⚠' :
                   insight.type === 'improvement' ? '↑' : '💡'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-900 dark:text-gray-300">{insight.description}</p>
                </div>
                <span className={`text-xs font-medium ${
                  insight.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                  insight.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {insight.priority}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Performance Analytics
          </h1>
          <p className="text-gray-700 dark:text-gray-400">
            Comprehensive insights into your learning and practice performance
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === 'overview'
                ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSection('learn')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === 'learn'
                ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
            }`}
          >
            Learn Mode ({learnSessions.length})
          </button>
          <button
            onClick={() => setActiveSection('practice')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeSection === 'practice'
                ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
            }`}
          >
            Practice Mode ({practiceSessions.length})
          </button>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Overall Stats */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">Overall Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {renderStatsCard('Total Questions', overallStats.totalQuestions)}
                {renderStatsCard('Correct Answers', overallStats.totalCorrect, 'text-green-600 dark:text-green-500')}
                {renderStatsCard('Wrong Answers', overallStats.totalWrong, 'text-red-600 dark:text-red-500')}
                {renderStatsCard('Accuracy', `${overallStats.accuracy.toFixed(1)}%`)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderStatsCard('Total Time', formatTime(overallStats.totalTime))}
                {renderStatsCard('Avg Time/Question', formatTime(overallStats.averageTimePerQuestion))}
                {renderStatsCard('Total Hints', overallStats.totalHints)}
                {renderStatsCard('Total Sessions', sessions.length)}
              </div>
            </section>

            {/* Key Insights */}
            {overallInsights.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-6">Key Insights</h2>
                {renderInsights(overallInsights)}
              </section>
            )}

            {/* Focus Recommendations */}
            {focusRecommendations.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-6">Focus Recommendations</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {focusRecommendations.slice(0, 6).map((rec, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground">Chapter {rec.chapter}</h3>
                        <span className={`text-xs font-medium ${
                          rec.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                          rec.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{rec.reason}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-500">
                        <span>Current: {rec.currentAccuracy.toFixed(1)}%</span>
                        <span>→</span>
                        <span>Target: {rec.targetAccuracy}%</span>
                        <span className="ml-auto font-medium">~{rec.questionsNeeded} more questions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mode Comparison */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">Mode Comparison</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Learn Mode</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-400">Questions:</span>
                        <span className="font-semibold">{learnStats.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-400">Accuracy:</span>
                        <span className={`font-semibold ${learnStats.accuracy >= 80 ? 'text-green-600' : learnStats.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {learnStats.accuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-400">Sessions:</span>
                      <span className="font-semibold">{learnSessions.length}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-lg border border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Practice Mode</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-400">Questions:</span>
                        <span className="font-semibold">{practiceStats.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-400">Accuracy:</span>
                        <span className={`font-semibold ${practiceStats.accuracy >= 80 ? 'text-green-600' : practiceStats.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {practiceStats.accuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-400">Sessions:</span>
                      <span className="font-semibold">{practiceSessions.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Performance Trends */}
            {sessions.length > 1 && (
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-6">Performance Over Time</h2>
                <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getPerformanceTrends(sessions)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="date" stroke={axisColor} />
                      <YAxis stroke={axisColor} domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="accuracy" stroke={successColor} strokeWidth={3} name="Accuracy %" dot={{ fill: successColor, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Learn Mode Section */}
        {activeSection === 'learn' && (
          <div className="space-y-8">
            {/* Learn Mode Stats */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">Learn Mode Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {renderStatsCard('Total Questions', learnStats.totalQuestions)}
                {renderStatsCard('Accuracy', `${learnStats.accuracy.toFixed(1)}%`)}
                {renderStatsCard('Total Time', formatTime(learnStats.totalTime))}
                {renderStatsCard('Sessions', learnSessions.length)}
              </div>
            </section>

            {/* Learn Mode Insights */}
            {learnInsights.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-6">Insights</h2>
                {renderInsights(learnInsights)}
              </section>
            )}

            {/* Learn Mode Chapter Stats */}
            {Object.keys(learnChapterStats).length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-6">Chapter Performance</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(learnChapterStats)
                    .sort(([_, a], [__, b]) => b.totalQuestions - a.totalQuestions)
                    .map(([chapter, stats]) => (
                      <ChapterStats key={chapter} topic={chapter} stats={stats} />
                    ))}
                </div>
              </section>
            )}

            {learnSessions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No learn mode data yet</p>
                <Link href="/learn" className="text-[#ea580c] hover:underline">Start Learning</Link>
              </div>
            )}
          </div>
        )}

        {/* Practice Mode Section */}
        {activeSection === 'practice' && (
          <div className="space-y-8">
            {/* Practice Mode Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
              <button
                onClick={() => setActivePracticeMode('all')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activePracticeMode === 'all'
                    ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
                }`}
              >
                All Practice ({practiceSessions.length})
              </button>
              <button
                onClick={() => setActivePracticeMode('chapterwise')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activePracticeMode === 'chapterwise'
                    ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
                }`}
              >
                Chapter Practice ({chapterwiseSessions.length})
              </button>
              <button
                onClick={() => setActivePracticeMode('quick-test')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activePracticeMode === 'quick-test'
                    ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
                }`}
              >
                Quick Test ({quickTestSessions.length})
              </button>
              <button
                onClick={() => setActivePracticeMode('full-test')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activePracticeMode === 'full-test'
                    ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
                }`}
              >
                Full Test ({fullTestSessions.length})
              </button>
              <button
                onClick={() => setActivePracticeMode('official-quick-test')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activePracticeMode === 'official-quick-test'
                    ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
                }`}
              >
                Official Quick ({officialQuickTestSessions.length})
              </button>
              <button
                onClick={() => setActivePracticeMode('official-full-test')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activePracticeMode === 'official-full-test'
                    ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
                }`}
              >
                Official Full ({officialFullTestSessions.length})
              </button>
              <button
                onClick={() => setActivePracticeMode('past-quick-test')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activePracticeMode === 'past-quick-test'
                    ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
                }`}
              >
                Past Quick ({pastQuickTestSessions.length})
              </button>
              <button
                onClick={() => setActivePracticeMode('past-full-test')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activePracticeMode === 'past-full-test'
                    ? 'border-b-2 border-[#ea580c] text-[#ea580c]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-foreground'
                }`}
              >
                Past Full ({pastFullTestSessions.length})
              </button>
            </div>

            {/* All Practice Mode */}
            {activePracticeMode === 'all' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Practice Mode Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {renderStatsCard('Total Questions', practiceStats.totalQuestions)}
                    {renderStatsCard('Accuracy', `${practiceStats.accuracy.toFixed(1)}%`)}
                    {renderStatsCard('Total Time', formatTime(practiceStats.totalTime))}
                    {renderStatsCard('Sessions', practiceSessions.length)}
                  </div>
                </section>

                {practiceInsights.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Insights</h2>
                    {renderInsights(practiceInsights)}
                  </section>
                )}

                {/* Practice Mode Breakdown */}
                <section>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Mode Breakdown</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-lg border border-gray-100 dark:border-gray-800">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Chapter Practice</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-400">Questions:</span>
                          <span className="font-semibold">{chapterwiseStats.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-400">Accuracy:</span>
                          <span className={`font-semibold ${chapterwiseStats.accuracy >= 75 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {chapterwiseStats.accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-400">Sessions:</span>
                          <span className="font-semibold">{chapterwiseSessions.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 rounded-lg border border-gray-100 dark:border-gray-800">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Test</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-400">Questions:</span>
                          <span className="font-semibold">{quickTestStats.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-400">Accuracy:</span>
                          <span className={`font-semibold ${quickTestStats.accuracy >= 80 ? 'text-green-600' : quickTestStats.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {quickTestStats.accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-400">Sessions:</span>
                          <span className="font-semibold">{quickTestSessions.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 rounded-lg border border-gray-100 dark:border-gray-800">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Full Test</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-400">Questions:</span>
                          <span className="font-semibold">{fullTestStats.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-400">Accuracy:</span>
                          <span className={`font-semibold ${fullTestStats.accuracy >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {fullTestStats.accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-400">Sessions:</span>
                          <span className="font-semibold">{fullTestSessions.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Chapter Stats */}
                {Object.keys(practiceChapterStats).length > 0 && (
                  <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Chapter Performance</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {Object.entries(practiceChapterStats)
                        .sort(([_, a], [__, b]) => b.totalQuestions - a.totalQuestions)
                        .map(([chapter, stats]) => (
                          <ChapterStats key={chapter} topic={chapter} stats={stats} />
                        ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Chapter Practice Mode */}
            {activePracticeMode === 'chapterwise' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Chapter Practice Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {renderStatsCard('Questions', chapterwiseStats.totalQuestions)}
                    {renderStatsCard('Accuracy', `${chapterwiseStats.accuracy.toFixed(1)}%`)}
                    {renderStatsCard('Avg Time', formatTime(chapterwiseStats.averageTimePerQuestion || 0))}
                    {renderStatsCard('Sessions', chapterwiseSessions.length)}
                  </div>
                </section>
                {chapterwiseInsights.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Insights</h2>
                    {renderInsights(chapterwiseInsights)}
                  </section>
                )}
                {chapterwiseSessions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No chapter practice data yet</p>
                    <Link href="/practice" className="text-[#ea580c] hover:underline">Start Practicing</Link>
                  </div>
                )}
              </div>
            )}

            {/* Quick Test Mode */}
            {activePracticeMode === 'quick-test' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Quick Test Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {renderStatsCard('Questions', quickTestStats.totalQuestions)}
                    {renderStatsCard('Accuracy', `${quickTestStats.accuracy.toFixed(1)}%`)}
                    {renderStatsCard('Avg Time', formatTime(quickTestStats.averageTimePerQuestion || 0))}
                    {renderStatsCard('Sessions', quickTestSessions.length)}
                  </div>
                </section>
                {quickTestInsights.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Insights</h2>
                    {renderInsights(quickTestInsights)}
                  </section>
                )}
                {quickTestSessions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No quick test data yet</p>
                    <Link href="/practice" className="text-[#ea580c] hover:underline">Take a Quick Test</Link>
                  </div>
                )}
              </div>
            )}

            {/* Full Test Mode */}
            {activePracticeMode === 'full-test' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Full Test Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {renderStatsCard('Questions', fullTestStats.totalQuestions)}
                    {renderStatsCard('Accuracy', `${fullTestStats.accuracy.toFixed(1)}%`)}
                    {renderStatsCard('Avg Time', formatTime(fullTestStats.averageTimePerQuestion || 0))}
                    {renderStatsCard('Sessions', fullTestSessions.length)}
                  </div>
                </section>
                {fullTestInsights.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Insights</h2>
                    {renderInsights(fullTestInsights)}
                  </section>
                )}
                {fullTestSessions.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Exam Readiness Analysis</h2>
                    <div className="p-6 rounded-lg border border-gray-100 dark:border-gray-800">
                      {fullTestStats.accuracy >= 70 ? (
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎉</div>
                          <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">
                            Exam Ready!
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300">
                            You&apos;re scoring {fullTestStats.accuracy.toFixed(1)}% in full tests. You&apos;re well-prepared for the actual exam!
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-4xl mb-2">📚</div>
                          <h3 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                            More Practice Needed
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Current accuracy: {fullTestStats.accuracy.toFixed(1)}%. Aim for 70%+ for exam readiness.
                          </p>
                          <div className="text-sm text-gray-600 dark:text-gray-500">
                            <p>Recommended actions:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Continue practicing chapter-wise questions</li>
                              <li>Review explanations for incorrect answers</li>
                              <li>Take more quick tests to build speed</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
                {fullTestSessions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No full test data yet</p>
                    <Link href="/practice" className="text-[#ea580c] hover:underline">Take a Full Test</Link>
                  </div>
                )}
              </div>
            )}

            {/* Official Quick Test Mode */}
            {activePracticeMode === 'official-quick-test' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Official Quick Test Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {renderStatsCard('Questions', officialQuickTestStats.totalQuestions)}
                    {renderStatsCard('Accuracy', `${officialQuickTestStats.accuracy.toFixed(1)}%`)}
                    {renderStatsCard('Avg Time', formatTime(officialQuickTestStats.averageTimePerQuestion || 0))}
                    {renderStatsCard('Sessions', officialQuickTestSessions.length)}
                  </div>
                </section>
                {officialQuickTestInsights.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Insights</h2>
                    {renderInsights(officialQuickTestInsights)}
                  </section>
                )}
                {officialQuickTestSessions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No official quick test data yet</p>
                    <Link href="/practice" className="text-[#ea580c] hover:underline">Take an Official Quick Test</Link>
                  </div>
                )}
              </div>
            )}

            {/* Official Full Test Mode */}
            {activePracticeMode === 'official-full-test' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Official Full Test Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {renderStatsCard('Questions', officialFullTestStats.totalQuestions)}
                    {renderStatsCard('Accuracy', `${officialFullTestStats.accuracy.toFixed(1)}%`)}
                    {renderStatsCard('Avg Time', formatTime(officialFullTestStats.averageTimePerQuestion || 0))}
                    {renderStatsCard('Sessions', officialFullTestSessions.length)}
                  </div>
                </section>
                {officialFullTestInsights.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Insights</h2>
                    {renderInsights(officialFullTestInsights)}
                  </section>
                )}
                {officialFullTestSessions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No official full test data yet</p>
                    <Link href="/practice" className="text-[#ea580c] hover:underline">Take an Official Full Test</Link>
                  </div>
                )}
              </div>
            )}

            {/* Past Quick Test Mode */}
            {activePracticeMode === 'past-quick-test' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Past Quick Test Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {renderStatsCard('Questions', pastQuickTestStats.totalQuestions)}
                    {renderStatsCard('Accuracy', `${pastQuickTestStats.accuracy.toFixed(1)}%`)}
                    {renderStatsCard('Avg Time', formatTime(pastQuickTestStats.averageTimePerQuestion || 0))}
                    {renderStatsCard('Sessions', pastQuickTestSessions.length)}
                  </div>
                </section>
                {pastQuickTestInsights.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Insights</h2>
                    {renderInsights(pastQuickTestInsights)}
                  </section>
                )}
                {pastQuickTestSessions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No past quick test data yet</p>
                    <Link href="/practice" className="text-[#ea580c] hover:underline">Take a Past Quick Test</Link>
                  </div>
                )}
              </div>
            )}

            {/* Past Full Test Mode */}
            {activePracticeMode === 'past-full-test' && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-foreground mb-6">Past Full Test Statistics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {renderStatsCard('Questions', pastFullTestStats.totalQuestions)}
                    {renderStatsCard('Accuracy', `${pastFullTestStats.accuracy.toFixed(1)}%`)}
                    {renderStatsCard('Avg Time', formatTime(pastFullTestStats.averageTimePerQuestion || 0))}
                    {renderStatsCard('Sessions', pastFullTestSessions.length)}
                  </div>
                </section>
                {pastFullTestInsights.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">Insights</h2>
                    {renderInsights(pastFullTestInsights)}
                  </section>
                )}
                {pastFullTestSessions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No past full test data yet</p>
                    <Link href="/practice" className="text-[#ea580c] hover:underline">Take a Past Full Test</Link>
                  </div>
                )}
              </div>
            )}

            {practiceSessions.length === 0 && activePracticeMode === 'all' && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No practice mode data yet</p>
                <Link href="/practice" className="text-[#ea580c] hover:underline">Start Practicing</Link>
              </div>
            )}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
          <Link href="/" className="text-sm text-gray-500 dark:text-gray-500 hover:text-foreground">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
