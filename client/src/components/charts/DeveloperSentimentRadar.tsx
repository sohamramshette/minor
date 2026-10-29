import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { DEMO_RADAR_DATA } from '../../utils/mockData';

export const DeveloperSentimentRadar: React.FC = () => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={DEMO_RADAR_DATA}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
          <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
          />
          <Radar
            name="Repo Baseline Index"
            dataKey="baseline"
            stroke="#64748b"
            fill="#64748b"
            fillOpacity={0.2}
          />
          <Radar
            name="Current Defect-Inducing Cohort"
            dataKey="current"
            stroke="#f43f5e"
            fill="#f43f5e"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
