import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DEMO_COMMITS } from '../../utils/mockData';

export const BugOriginProbabilityChart: React.FC = () => {
  const chartData = DEMO_COMMITS.map((c) => ({
    commit: c.shortHash,
    probability: Math.round(c.risk.probability * 100),
    level: c.risk.level,
    message: c.message,
    author: c.author,
  }));

  const getColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'moderate':
        return '#eab308';
      default:
        return '#10b981';
    }
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
          <XAxis
            dataKey="commit"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1f293d' }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            domain={[0, 100]}
            unit="%"
            tickLine={false}
            axisLine={{ stroke: '#1f293d' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value}% Probability`, 'Bug Origin Risk']}
            labelFormatter={(label: string) => `Commit: ${label}`}
          />
          <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={getColor(entry.level)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
