import React from 'react';
import {
  BrainCircuit,
  Flame,
  Activity,
  Sparkles,
  Zap,
  MessageSquare,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { DeveloperSentimentRadar } from '../components/charts/DeveloperSentimentRadar';
import { SentimentTimelineChart } from '../components/charts/SentimentTimelineChart';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { DEMO_METRICS } from '../utils/mockData';

export const SentimentAnalysisPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <DemoNoticeBadge variant="banner" />

      {/* Hero NLP Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-purple-950/20 border border-slate-800 p-6 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              VADER + RoBERTa NLP Pipeline
            </span>
            <span className="text-xs text-slate-400">Developer Cognitive State Extraction</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Developer Affective State & Sentiment Analysis
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Quantifying developer frustration, urgency, and cognitive fatigue from commit messages and code review exchanges. Studies show that high developer emotional distress strongly correlates with defect injection.
          </p>
        </div>
      </div>

      {/* Key Sentiment KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Sentiment Polarity</span>
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">-0.24</div>
          <p className="text-[11px] text-amber-400 flex items-center gap-1">
            <span>Leaning negative during sprint freeze</span>
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Crunch Stress Index</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {DEMO_METRICS.averageStressIndex} / 100
          </div>
          <p className="text-[11px] text-rose-400 flex items-center gap-1">
            <span>Elevated cognitive churn threshold</span>
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pearson Correlation (r)</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            r = {DEMO_METRICS.correlationScore}
          </div>
          <p className="text-[11px] text-slate-400">Statistically significant (p &lt; 0.001)</p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Model Classifier Accuracy</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {DEMO_METRICS.mlAccuracy}
          </div>
          <p className="text-[11px] text-slate-400">Evaluated on cross-validated benchmark</p>
        </div>
      </div>

      {/* Radar & Timeline Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" />
                <span>Multi-Dimensional Sentiment Profiling</span>
              </h3>
              <p className="text-xs text-slate-400">
                Comparing inducing commits against general repository baseline.
              </p>
            </div>
            <DemoNoticeBadge />
          </div>
          <DeveloperSentimentRadar />
        </div>

        {/* Timeline Chart */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>Temporal Sentiment vs Bug Inception</span>
              </h3>
              <p className="text-xs text-slate-400">
                Stress surges lead bug spikes by a predictable 2-4 day lag.
              </p>
            </div>
            <DemoNoticeBadge />
          </div>
          <SentimentTimelineChart />
        </div>
      </div>

      {/* Detected Linguistic Emotional Markers */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span>High-Risk Affective Linguistic Markers in Commits</span>
        </h3>
        <p className="text-xs text-slate-400">
          Phrases frequently extracted by EmotionTrace NLP tokenizers that correlate with subsequent SZZ bug reports.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {[
            { tag: '"dirty workaround"', freq: '24 occurrences', impact: '+42% Bug Risk', type: 'frustrated' },
            { tag: '"temporary hack"', freq: '38 occurrences', impact: '+58% Bug Risk', type: 'urgent' },
            { tag: '"why does this even happen"', freq: '12 occurrences', impact: '+64% Bug Risk', type: 'frustrated' },
            { tag: '"emergency patch"', freq: '45 occurrences', impact: '+51% Bug Risk', type: 'urgent' },
            { tag: '"quick fix for now"', freq: '51 occurrences', impact: '+39% Bug Risk', type: 'neutral' },
            { tag: '"bypassing validation"', freq: '19 occurrences', impact: '+72% Bug Risk', type: 'critical' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="font-mono text-xs font-semibold text-rose-300">
                  {item.tag}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{item.freq}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {item.impact}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
