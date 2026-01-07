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
import { AnalyticsData } from '@/lib/types';
import AnalyticsChart from '@/components/AnalyticsChart';
import ChapterStats from '@/components/ChapterStats';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  const isDark = useDarkMode();

  useEffect(() => {
    async function loadAnalytics() {
      const data = await getAnalyticsData();
      setAnalytics(data);
    }
    loadAnalytics();
  }, []);

  // Chart colors - deep saturated orange brand color
  const barColor = '#ea580c'; // Deep saturated orange (same in both modes)
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';

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

  const { overallStats, chapterStats, sessions } = analytics;

  const pieChartData = [
    { name: 'Correct', value: overallStats.totalCorrect },
    { name: 'Wrong', value: overallStats.totalWrong },
  ];

  const chapterNames = Object.keys(chapterStats);
  const barChartData = chapterNames.map(topic => ({
    name: topic,
    value: chapterStats[topic].totalQuestions,
  }));

  const timeDistribution = getTimeDistribution(sessions);
  const performanceTrends = getPerformanceTrends(sessions);
  const questionDifficulty = getQuestionDifficulty(sessions).slice(0, 10);
  const { best, worst } = getBestWorstTopics(sessions);
  const improvementRate = getImprovementRate(sessions);
  const hintsTrends = getHintsUsageTrends(sessions);
  const chapterComparison = getChapterComparison(sessions);
  const dailyActivity = getDailyActivity(sessions);

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 pb-6">
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            Performance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Track your performance across all topics
          </p>
        </div>

        {/* Overall Statistics */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Overall Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Total Questions</div>
              <div className="text-2xl font-semibold text-foreground">
                {overallStats.totalQuestions}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Correct Answers</div>
              <div className="text-2xl font-semibold text-green-600 dark:text-green-500">
                {overallStats.totalCorrect}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Wrong Answers</div>
              <div className="text-2xl font-semibold text-red-600 dark:text-red-500">
                {overallStats.totalWrong}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Accuracy</div>
              <div className="text-2xl font-semibold text-foreground">
                {overallStats.accuracy.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Total Time</div>
              <div className="text-xl font-semibold text-foreground">
                {formatTime(overallStats.totalTime)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Avg Time/Question</div>
              <div className="text-xl font-semibold text-foreground">
                {formatTime(overallStats.averageTimePerQuestion)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Total Hints Used</div>
              <div className="text-xl font-semibold text-foreground">
                {overallStats.totalHints}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Total Sessions</div>
              <div className="text-xl font-semibold text-foreground">
                {analytics.sessions.length}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <AnalyticsChart
              type="pie"
              data={pieChartData}
              title="Correct vs Wrong Answers"
            />
            {barChartData.length > 0 && (
              <AnalyticsChart
                type="bar"
                data={barChartData}
                title="Questions per Chapter"
              />
            )}
          </div>

          {/* Advanced Analytics */}
          {sessions.length > 0 && (
            <>
              {/* Performance Trends */}
              {performanceTrends.length > 1 && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-foreground mb-4">Performance Over Time</h3>
                  <div className="rounded p-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={performanceTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="date" stroke={axisColor} />
                        <YAxis stroke={axisColor} domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} name="Accuracy %" dot={{ fill: '#10b981', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Time Distribution */}
              {timeDistribution.some(d => d.count > 0) && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-foreground mb-4">Time Distribution</h3>
                  <div className="rounded p-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={timeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="range" stroke={axisColor} />
                        <YAxis stroke={axisColor} />
                        <Tooltip />
                        <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Hints Usage Trends */}
              {hintsTrends.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-foreground mb-4">Hints Usage Over Time</h3>
                  <div className="rounded p-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={hintsTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="date" stroke={axisColor} />
                        <YAxis stroke={axisColor} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="hintRate" stroke="#f59e0b" strokeWidth={3} name="Hint Usage %" dot={{ fill: '#f59e0b', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Chapter Comparison */}
              {chapterComparison.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-foreground mb-4">Chapter Accuracy Comparison</h3>
                  <div className="rounded p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chapterComparison} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" domain={[0, 100]} stroke={axisColor} />
                        <YAxis dataKey="name" type="category" width={120} stroke={axisColor} />
                        <Tooltip />
                        <Bar dataKey="accuracy" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Daily Activity */}
              {dailyActivity.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-foreground mb-4">Daily Activity</h3>
                  <div className="rounded p-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="date" stroke={axisColor} />
                        <YAxis stroke={axisColor} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="questions" fill={barColor} name="Questions" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="sessions" fill="#c2410c" name="Sessions" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {best && (
                  <div className="rounded p-5 border-l-4 border-green-600">
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Best Performing Topic</div>
                    <div className="text-xl font-semibold text-foreground mb-1">{best}</div>
                    <div className="text-sm font-medium text-green-600 dark:text-green-500">
                      {chapterStats[best]?.accuracy.toFixed(1)}% accuracy
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {chapterStats[best]?.totalQuestions} questions attempted
                    </div>
                  </div>
                )}
                {worst && (
                  <div className="rounded p-5 border-l-4 border-red-600">
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Needs Improvement</div>
                    <div className="text-xl font-semibold text-foreground mb-1">{worst}</div>
                    <div className="text-sm font-medium text-red-600 dark:text-red-500">
                      {chapterStats[worst]?.accuracy.toFixed(1)}% accuracy
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {chapterStats[worst]?.totalQuestions} questions attempted
                    </div>
                  </div>
                )}
                {sessions.length >= 2 && (
                  <div className="rounded p-5 border-l-4 border-foreground">
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">Improvement Rate</div>
                    <div className={`text-2xl font-bold ${improvementRate > 0 ? 'text-green-600 dark:text-green-500' : improvementRate < 0 ? 'text-red-600 dark:text-red-500' : 'text-foreground'}`}>
                      {improvementRate > 0 ? '↑' : improvementRate < 0 ? '↓' : '→'} {improvementRate > 0 ? '+' : ''}{improvementRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {improvementRate > 0 ? 'Improving' : improvementRate < 0 ? 'Declining' : 'Stable'}
                    </div>
                  </div>
                )}
              </div>

              {/* Most Challenging Questions */}
              {questionDifficulty.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-foreground mb-4">Most Challenging Questions</h3>
                  <div className="space-y-2">
                    {questionDifficulty.map((q, idx) => (
                      <div key={idx} className="rounded p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/15 dark:hover:bg-gray-800/10">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-medium text-gray-400 dark:text-gray-600">#{idx + 1}</span>
                            <div className="text-sm font-semibold text-foreground">{q.topic} - Q{q.questionId}</div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                            <span>{q.attempts} attempts</span>
                            <span className={`font-medium ${q.correctRate < 50 ? 'text-red-600 dark:text-red-500' : q.correctRate < 70 ? 'text-gray-600 dark:text-gray-400' : 'text-green-600 dark:text-green-500'}`}>
                              {q.correctRate.toFixed(0)}% correct
                            </span>
                            <span>{formatTime(q.averageTime)} avg</span>
                            <span>{q.hintUsageRate.toFixed(0)}% hints</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold ${
                            q.correctRate < 50 ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-500' :
                            q.correctRate < 70 ? 'bg-gray-100/50 dark:bg-gray-100/10 text-gray-600 dark:text-gray-400' :
                            'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-500'
                          }`}>
                            {q.correctRate.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Per Chapter Statistics */}
        {chapterNames.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Per Chapter Statistics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chapterNames.map(topic => (
                <ChapterStats
                  key={topic}
                  topic={topic}
                  stats={chapterStats[topic]}
                />
              ))}
            </div>
          </div>
        )}

        {overallStats.totalQuestions === 0 && (
          <div className="text-center py-16 mt-12">
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              No data available yet. Start practicing to see your analytics!
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 text-sm text-foreground bg-transparent border border-gray-200 dark:border-gray-800 rounded hover:bg-gray-50/15 dark:hover:bg-gray-800/10"
            >
              Start Practicing
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

