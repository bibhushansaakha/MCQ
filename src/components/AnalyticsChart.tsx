'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PieChartData {
  name: string;
  value: number;
}

interface BarChartData {
  name: string;
  value: number;
}

interface AnalyticsChartProps {
  type: 'pie' | 'bar';
  data: PieChartData[] | BarChartData[];
  title: string;
}

const COLORS = ['#10b981', '#ef4444']; // Green for correct, red for wrong

export default function AnalyticsChart({ type, data, title }: AnalyticsChartProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  // Bar chart colors - deep saturated orange brand color
  const barColor = '#ea580c'; // Deep saturated orange (same in both modes)
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';

  if (type === 'pie') {
    return (
      <div className="rounded p-6">
        <h3 className="text-base font-semibold text-foreground mb-6">{title}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data as PieChartData[]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {(data as PieChartData[]).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="rounded p-6 bg-gray-50/50 dark:bg-gray-100/10">
      <h3 className="text-base font-semibold text-foreground mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data as BarChartData[]}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={axisColor} />
          <YAxis stroke={axisColor} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill={barColor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

