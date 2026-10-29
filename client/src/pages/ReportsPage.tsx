import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  BookOpen,
  Award,
  Layers,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCode,
} from 'lucide-react';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { fetchAnalyses } from '../services/api';
import { ApiAnalysis, BackendHealth } from '../types';

interface ReportsPageProps {
  backendHealth?: BackendHealth | null;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ backendHealth }) => {
  const isDbConnected = backendHealth?.services?.database === 'connected';
  const [viewMode, setViewMode] = useState<'persisted' | 'benchmark'>(
    isDbConnected ? 'persisted' : 'benchmark'
  );

  const [analyses, setAnalyses] = useState<ApiAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAnalyses = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchAnalyses();
      setAnalyses(res.items || []);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to load analysis runs from MongoDB Atlas.'
      );
      setAnalyses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'persisted') {
      loadAnalyses();
    }
  }, [viewMode, isDbConnected]);

  return (
    <div className="space-y-6">
      {/* View Switcher and DB Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('persisted')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'persisted'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>MongoDB Analysis Runs</span>
            {analyses.length > 0 && viewMode === 'persisted' && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/30 text-indigo-200">
                {analyses.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewMode('benchmark')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'benchmark'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Benchmark & Research Audits</span>
          </button>
        </div>

        {/* Database connectivity status */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono ${
              isDbConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDbConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>
              MongoDB Atlas: <strong className="capitalize">{backendHealth?.services?.database ?? 'unconfigured'}</strong>
            </span>
          </div>

          {viewMode === 'persisted' && (
            <button
              onClick={loadAnalyses}
              disabled={isLoading}
              title="Refresh analysis records"
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* ================= PERSISTED MONGODB ANALYSIS RUNS ================= */}
      {viewMode === 'persisted' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Persisted records from the <strong>analyses</strong> MongoDB collection. Tracks execution runs, timestamps, and model metric summaries.
              </span>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-white">Querying analyses from MongoDB Atlas...</p>
            </div>
          )}

          {/* Error */}
          {!isLoading && errorMessage && (
            <div className="rounded-2xl bg-rose-950/20 border border-rose-900/40 p-6 space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold">Failed to Fetch Analysis History</h4>
              </div>
              <p className="text-xs text-slate-300">{errorMessage}</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !errorMessage && analyses.length === 0 && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-12 text-center space-y-3">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Analysis Runs Logged Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No pipeline runs have been executed or saved to MongoDB Atlas yet. Analysis runs triggered during repository ingestion will be indexed here.
              </p>
            </div>
          )}

          {/* Records Table */}
          {!isLoading && !errorMessage && analyses.length > 0 && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Persisted Analysis Runs ({analyses.length})</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Analysis ID</th>
                      <th className="py-3 px-4">Repository</th>
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4">Commits Scanned</th>
                      <th className="py-3 px-4">Defect Candidates</th>
                      <th className="py-3 px-4">Started At</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {analyses.map((run) => {
                      const repoName =
                        typeof run.repositoryId === 'object' && run.repositoryId !== null
                          ? (run.repositoryId as any).fullName
                          : String(run.repositoryId).slice(0, 10);

                      return (
                        <tr key={run.id || run._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-indigo-300">
                            {(run.id || run._id || '').slice(0, 8)}...
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">{repoName}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">{run.branch}</td>
                          <td className="py-3.5 px-4 font-mono">
                            {run.summaryMetrics?.totalCommits ?? 0}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-rose-400 font-semibold">
                            {run.summaryMetrics?.highRiskCommits ?? 0}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">
                            {new Date(run.startedAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono capitalize border ${
                                run.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : run.status === 'in_progress'
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}
                            >
                              {run.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= BENCHMARK & RESEARCH AUDITS VIEW ================= */}
      {viewMode === 'benchmark' && (
        <div className="space-y-6">
          <DemoNoticeBadge variant="banner" />

          {/* Hero Card */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/30 border border-slate-800 p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    Academic Minor Project
                  </span>
                  <span className="text-xs text-slate-400">Research & Audit Trail</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Reports, Benchmarks & Analysis History
                </h2>
                <p className="text-xs text-slate-300 max-w-xl">
                  Comprehensive performance audits, model validation metrics, and exportable report summaries of defect origin predictions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => alert('Demo Mode: Report export will be generated in Phase 3 via backend.')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Summary (PDF/JSON)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Academic Project Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <BookOpen className="w-4 h-4" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Research Abstract
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                EmotionTrace proposes a novel fusion architecture integrating the classical Śliwerski-Zimmermann-Zeller (SZZ) git blame algorithm with multi-modal developer sentiment extraction from commit messages to predict bug origin likelihood before regression deployment.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Award className="w-4 h-4" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Benchmark Results
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Baseline SZZ Accuracy:</span>
                  <span className="font-mono text-slate-300">64.2% F1</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">EmotionTrace Fusion:</span>
                  <span className="font-mono text-emerald-400 font-bold">87.4% F1 (+23.2%)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Pearson r (Stress/Bugs):</span>
                  <span className="font-mono text-indigo-400 font-bold">r = 0.76 (p &lt; 0.001)</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Layers className="w-4 h-4" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  System Architecture
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Frontend:</span>
                  <span className="font-mono text-white">React 18 + Vite + TS</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Backend API:</span>
                  <span className="font-mono text-white">Express + Node + TS</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Persistence:</span>
                  <span className="font-mono text-emerald-400 font-semibold">MongoDB Atlas + Mongoose</span>
                </div>
              </div>
            </div>
          </div>

          {/* Benchmark Scans Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Historical Benchmark Corpus Scans</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Repository Target</th>
                    <th className="py-3 px-4">Commits Scanned</th>
                    <th className="py-3 px-4">Suspected Bug Origins</th>
                    <th className="py-3 px-4">Sentiment Index</th>
                    <th className="py-3 px-4">Scan Completed</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {[
                    {
                      repo: 'facebook/react',
                      commits: 1428,
                      origins: 42,
                      sentiment: '-0.24 (Leaning Frustrated)',
                      time: '2026-10-25 21:40 UTC',
                      status: 'Completed',
                    },
                    {
                      repo: 'microsoft/vscode',
                      commits: 3120,
                      origins: 98,
                      sentiment: '+0.12 (Neutral)',
                      time: '2026-10-23 18:15 UTC',
                      status: 'Completed',
                    },
                    {
                      repo: 'nodejs/node',
                      commits: 2240,
                      origins: 64,
                      sentiment: '-0.41 (Urgent/Stressed)',
                      time: '2026-10-21 11:30 UTC',
                      status: 'Completed',
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {row.repo}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{row.commits.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-mono text-rose-400 font-semibold">
                        {row.origins}
                      </td>
                      <td className="py-3.5 px-4">{row.sentiment}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{row.time}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{row.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
