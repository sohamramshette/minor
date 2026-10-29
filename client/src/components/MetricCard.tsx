import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  accentGradient?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-indigo-400',
  accentGradient = 'from-indigo-500/10 to-transparent',
}) => {
  return (
    <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800/80 p-5 hover:border-slate-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accentGradient} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-white font-mono">{value}</h3>
            {change && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  changeType === 'positive'
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : changeType === 'negative'
                    ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                    : 'text-slate-400 bg-slate-800 border border-slate-700'
                }`}
              >
                {change}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 leading-relaxed">{subtitle}</p>}
        </div>

        <div className={`p-3 rounded-xl bg-slate-800/70 border border-slate-700/50 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
