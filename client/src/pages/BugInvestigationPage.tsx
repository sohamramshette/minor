import React, { useState } from 'react';
import {
  Bug,
  GitCommit,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  ExternalLink,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { DEMO_BUG_REPORTS, DEMO_COMMITS } from '../utils/mockData';
import { DemoBugReport } from '../types';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { getSentimentBadgeClasses } from '../utils/formatters';

export const BugInvestigationPage: React.FC = () => {
  const [selectedBugId, setSelectedBugId] = useState<string>(DEMO_BUG_REPORTS[0].id);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredBugs = DEMO_BUG_REPORTS.filter((bug) => {
    return severityFilter === 'all' || bug.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  const selectedBug = DEMO_BUG_REPORTS.find((b) => b.id === selectedBugId) || DEMO_BUG_REPORTS[0];
  const originCommit = DEMO_COMMITS.find((c) => c.hash === selectedBug.suspectedOriginCommit);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'major':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <DemoNoticeBadge variant="banner" />

      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Causal Origin Tracer
            </span>
            <span className="text-xs text-slate-400">Śliwerski-Zimmermann-Zeller (SZZ) + Emotion</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Defect Inception & Bug Origin Investigation
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Trace production bug fixes back through git blame histories to the exact commit where the flaw was originally introduced, cross-referencing developer affective sentiment at the time of commit.
          </p>
        </div>
      </div>

      {/* Main Investigation Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bug Case List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-indigo-400" />
              <span>Investigated Defect Incidents</span>
            </h3>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
            </select>
          </div>

          <div className="space-y-2.5">
            {filteredBugs.map((bug) => {
              const isSelected = selectedBug.id === bug.id;
              return (
                <div
                  key={bug.id}
                  onClick={() => setSelectedBugId(bug.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {bug.ticketId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${getSeverityBadge(
                        bug.severity
                      )}`}
                    >
                      {bug.severity}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-2 mb-2">
                    {bug.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Reported: {bug.reportedDate}</span>
                    <span className="text-emerald-400 font-mono font-medium">
                      {Math.round(bug.confidenceScore * 100)}% match
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Bug Detailed Postmortem */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6 shadow-xl">
            {/* Case Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {selectedBug.ticketId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${getSeverityBadge(
                    selectedBug.severity
                  )}`}
                >
                  {selectedBug.severity} Severity
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {selectedBug.title}
              </h3>
            </div>

            {/* Causal Timeline: Inducing Commit -> Bug Ticket -> Fix Commit */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Causal Traceability Chain
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
                {/* 1. Inducing origin commit */}
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 space-y-1">
                  <div className="text-[10px] text-rose-400 font-bold uppercase">1. Bug Origin</div>
                  <div className="font-mono text-white text-[11px] truncate">
                    {selectedBug.suspectedOriginCommit.slice(0, 7)}
                  </div>
                  <div className="text-[10px] text-slate-400">Defect Introducer</div>
                </div>

                <div className="hidden md:flex justify-center text-slate-600">
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                </div>

                {/* 2. Fix commit */}
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 space-y-1">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">2. Fix Commit</div>
                  <div className="text-white text-[11px] truncate">
                    {selectedBug.fixedInCommit}
                  </div>
                  <div className="text-[10px] text-slate-400">Closed via SZZ Blame</div>
                </div>
              </div>
            </div>

            {/* Diagnostic Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Root Cause Synthesis
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                {selectedBug.summary}
              </p>
            </div>

            {/* Origin Commit Metadata */}
            {originCommit && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Author at Inception:</span>
                  <span className="text-white font-semibold">{originCommit.author}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Affective State Tone:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] capitalize ${getSentimentBadgeClasses(
                      originCommit.sentiment.tone
                    )}`}
                  >
                    {originCommit.sentiment.tone} (Score: {originCommit.sentiment.score})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Inception Timestamp:</span>
                  <span className="font-mono text-slate-300">{originCommit.date}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
