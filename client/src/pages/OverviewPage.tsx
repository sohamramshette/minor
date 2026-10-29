import React from 'react';
import {
  GitCommit,
  ShieldAlert,
  Flame,
  TrendingUp,
  BrainCircuit,
  ExternalLink,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { RepoInputBanner } from '../components/RepoInputBanner';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { SentimentTimelineChart } from '../components/charts/SentimentTimelineChart';
import { RiskDistributionChart } from '../components/charts/RiskDistributionChart';
import { DEMO_COMMITS, DEMO_METRICS } from '../utils/mockData';
import { getRiskBadgeClasses, getSentimentBadgeClasses } from '../utils/formatters';
import { NavigationTab } from '../types';

interface OverviewPageProps {
  onNavigateTab: (tab: NavigationTab) => void;
  onSelectRepo: (repo: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigateTab,
  onSelectRepo,
}) => {
  return (
    <div className="space-y-6">
      {/* Demo dataset disclaimer banner */}
      <DemoNoticeBadge variant="banner" />

      {/* Interactive Repo Analyzer input */}
      <RepoInputBanner onAnalyze={onSelectRepo} />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Analyzed Commits"
          value={DEMO_METRICS.totalCommits.toLocaleString()}
          subtitle="Processed through Git history AST"
          change="+142 this week"
          changeType="positive"
          icon={GitCommit}
          iconColor="text-indigo-400"
          accentGradient="from-indigo-600/20 to-transparent"
        />

        <MetricCard
          title="Defect-Inducing Candidates"
          value={DEMO_METRICS.highRiskCommits}
          subtitle="Flagged by SZZ + ML classifier"
          change="18.2% of commits"
          changeType="negative"
          icon={ShieldAlert}
          iconColor="text-rose-400"
          accentGradient="from-rose-600/20 to-transparent"
        />

        <MetricCard
          title="Avg Developer Stress Score"
          value={`${DEMO_METRICS.averageStressIndex} / 100`}
          subtitle="VADER & RoBERTa text emotion"
          change="+8.4 pts during crunch"
          changeType="negative"
          icon={Flame}
          iconColor="text-amber-400"
          accentGradient="from-amber-600/20 to-transparent"
        />

        <MetricCard
          title="Sentiment-Bug Correlation"
          value={`r = ${DEMO_METRICS.correlationScore}`}
          subtitle="Strong statistical significance (p < 0.001)"
          change="F1: 87.4%"
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-emerald-400"
          accentGradient="from-emerald-600/20 to-transparent"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>Developer Stress vs Defect Inception Timeline</span>
              </h3>
              <p className="text-xs text-slate-400">
                Observing correlation between elevated commit stress levels and subsequent bug reports.
              </p>
            </div>
            <DemoNoticeBadge />
          </div>
          <SentimentTimelineChart />
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Commit Defect Risk Distribution</span>
              </h3>
              <p className="text-xs text-slate-400">
                Proportion of commits by predicted fault likelihood.
              </p>
            </div>
          </div>
          <RiskDistributionChart />
        </div>
      </div>

      {/* Recent High-Risk Commits Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Prioritized Bug-Inducing Commit Candidates</span>
            </h3>
            <p className="text-xs text-slate-400">
              Commits exhibiting extreme frustration markers and high cyclomatic code churn.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('commits')}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <span>View All in Commit Explorer</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Commit Hash</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Message</th>
                <th className="py-3 px-4">Sentiment Tone</th>
                <th className="py-3 px-4">Bug Risk</th>
                <th className="py-3 px-4">Code Churn</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {DEMO_COMMITS.slice(0, 4).map((commit) => (
                <tr
                  key={commit.id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onNavigateTab('commits')}
                >
                  <td className="py-3.5 px-4 font-mono text-indigo-300 font-medium">
                    {commit.shortHash}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={commit.avatar}
                        alt={commit.author}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-white font-medium">{commit.author}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-300">
                    {commit.message}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${getSentimentBadgeClasses(
                        commit.sentiment.tone
                      )}`}
                    >
                      {commit.sentiment.tone} ({Math.round(commit.sentiment.score * 100) / 100})
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize font-mono ${getRiskBadgeClasses(
                        commit.risk.level
                      )}`}
                    >
                      {Math.round(commit.risk.probability * 100)}% {commit.risk.level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <span className="text-emerald-400">+{commit.churn.insertions}</span>{' '}
                    <span className="text-rose-400">-{commit.churn.deletions}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="text-slate-400 group-hover:text-white p-1 hover:bg-slate-700/60 rounded">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
