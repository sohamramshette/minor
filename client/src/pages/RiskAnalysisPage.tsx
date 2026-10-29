import React from 'react';
import {
  ShieldAlert,
  Cpu,
  BarChart3,
  Layers,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
} from 'lucide-react';
import { BugOriginProbabilityChart } from '../components/charts/BugOriginProbabilityChart';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';

export const RiskAnalysisPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <DemoNoticeBadge variant="banner" />

      {/* Hero explanation card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
              SZZ Algorithm & Sentiment Fusion
            </span>
            <span className="text-xs text-slate-400">Predictive Defect Modeling</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Defect Inception Risk Engine
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            EmotionTrace combines the classical <strong>SZZ Algorithm</strong> (which traces bug fixes back to the inducing commit via AST git blame analysis) with <strong>Developer Emotional Sentiment</strong> extracted from commit messages and code review exchanges to compute probability scores for future defect introduction.
          </p>
        </div>
      </div>

      {/* Bug Origin Probability Chart */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-400" />
              <span>Ranked Bug-Inducing Probability by Commit</span>
            </h3>
            <p className="text-xs text-slate-400">
              Top candidate commits ranked by machine-learned likelihood of bug origin.
            </p>
          </div>
          <DemoNoticeBadge />
        </div>
        <BugOriginProbabilityChart />
      </div>

      {/* Model Feature Weights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              1. Sentiment Polarity
            </span>
            <span className="text-xs font-mono text-indigo-400 font-bold">Weight: 32%</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Measures developer stress, frustration keywords, urgency, and fatigue tokens extracted via VADER and fine-tuned RoBERTa.
          </p>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '32%' }} />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              2. Code Churn & Scope
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">Weight: 41%</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Quantifies number of insertions, deletions, modified files, and ratio of modified control statements to total churn.
          </p>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '41%' }} />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              3. Temporal & Author Context
            </span>
            <span className="text-xs font-mono text-amber-400 font-bold">Weight: 27%</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Off-hours authoring (late night / crunch hours), days before sprint release deadline, and author past tenure on touched subsystems.
          </p>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '27%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
