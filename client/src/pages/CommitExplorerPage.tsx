import React, { useState, useEffect } from 'react';
import {
  Search,
  GitCommit,
  Clock,
  ChevronDown,
  ChevronUp,
  Tag,
  Database,
  RefreshCw,
  FileCode,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DEMO_COMMITS } from '../utils/mockData';
import { DemoCommit, ApiCommit, ApiRepository, BackendHealth } from '../types';
import { getRiskBadgeClasses, getSentimentBadgeClasses } from '../utils/formatters';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { fetchRepositories, fetchRepositoryCommits } from '../services/api';

interface CommitExplorerPageProps {
  backendHealth?: BackendHealth | null;
}

export const CommitExplorerPage: React.FC<CommitExplorerPageProps> = ({
  backendHealth,
}) => {
  const isDbConnected = backendHealth?.services?.database === 'connected';
  const [viewMode, setViewMode] = useState<'persisted' | 'demo'>(
    isDbConnected ? 'persisted' : 'demo'
  );

  // Demo state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [expandedCommitId, setExpandedCommitId] = useState<string | null>(DEMO_COMMITS[0].id);

  // MongoDB persisted state
  const [repositories, setRepositories] = useState<ApiRepository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [persistedCommits, setPersistedCommits] = useState<ApiCommit[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCommitsCount, setTotalCommitsCount] = useState<number>(0);
  const [isLoadingCommits, setIsLoadingCommits] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load repositories for dropdown
  useEffect(() => {
    if (viewMode === 'persisted' && isDbConnected) {
      fetchRepositories()
        .then((res) => {
          setRepositories(res.items || []);
          if (res.items && res.items.length > 0 && !selectedRepoId) {
            setSelectedRepoId(res.items[0].id || (res.items[0] as any)._id);
          }
        })
        .catch(() => {
          setRepositories([]);
        });
    }
  }, [viewMode, isDbConnected]);

  // Load commits when repository or page changes
  useEffect(() => {
    if (viewMode === 'persisted' && selectedRepoId) {
      setIsLoadingCommits(true);
      setErrorMessage(null);

      fetchRepositoryCommits(selectedRepoId, {
        page: currentPage,
        limit: 10,
        riskLevel: selectedRisk !== 'all' ? selectedRisk : undefined,
        sentimentTone: selectedSentiment !== 'all' ? selectedSentiment : undefined,
        search: searchTerm.trim() || undefined,
      })
        .then((res) => {
          setPersistedCommits(res.items || []);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalCommitsCount(res.pagination?.total || 0);
        })
        .catch((err) => {
          setErrorMessage(
            err?.response?.data?.message || 'Failed to fetch commits from MongoDB Atlas.'
          );
          setPersistedCommits([]);
        })
        .finally(() => {
          setIsLoadingCommits(false);
        });
    }
  }, [viewMode, selectedRepoId, currentPage, selectedRisk, selectedSentiment, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedCommitId(expandedCommitId === id ? null : id);
  };

  const filteredDemoCommits = DEMO_COMMITS.filter((commit) => {
    const matchesSearch =
      commit.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commit.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commit.shortHash.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSentiment =
      selectedSentiment === 'all' || commit.sentiment.tone === selectedSentiment;

    const matchesRisk = selectedRisk === 'all' || commit.risk.level === selectedRisk;

    return matchesSearch && matchesSentiment && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* View Switcher and Toolbar */}
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
            <span>MongoDB Commits</span>
          </button>

          <button
            onClick={() => setViewMode('demo')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'demo'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Synthetic Benchmark Commits</span>
          </button>
        </div>

        {/* Database connectivity indicator */}
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
              MongoDB: <strong className="capitalize">{backendHealth?.services?.database ?? 'unconfigured'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ================= PERSISTED MONGODB COMMITS VIEW ================= */}
      {viewMode === 'persisted' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <span>Persisted MongoDB Commit Documents</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Real records stored in the &apos;commits&apos; collection with compound indexes preventing duplicates.
                </p>
              </div>

              {/* Repository Selector */}
              {repositories.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Repository:</span>
                  <select
                    value={selectedRepoId}
                    onChange={(e) => {
                      setSelectedRepoId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    {repositories.map((repo) => (
                      <option key={repo.id || repo._id} value={repo.id || repo._id}>
                        {repo.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter message or author..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">Sentiment:</span>
                <select
                  value={selectedSentiment}
                  onChange={(e) => {
                    setSelectedSentiment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 capitalize"
                >
                  <option value="all">All Tones</option>
                  <option value="frustrated">Frustrated</option>
                  <option value="urgent">Urgent</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                  <option value="positive">Positive</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">Risk:</span>
                <select
                  value={selectedRisk}
                  onChange={(e) => {
                    setSelectedRisk(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 capitalize"
                >
                  <option value="all">All Risk</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="moderate">Moderate</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Database offline or unconfigured */}
          {!isDbConnected && (
            <div className="rounded-2xl bg-amber-950/20 border border-amber-900/30 p-8 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">MongoDB Atlas Not Connected</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                The database is unconfigured or offline. To view persisted MongoDB records, configure MONGODB_URI in your .env file or explore the Synthetic Benchmark Commits.
              </p>
              <button
                onClick={() => setViewMode('demo')}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
              >
                Switch to Synthetic Benchmark Commits
              </button>
            </div>
          )}

          {/* Loading state */}
          {isDbConnected && isLoadingCommits && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-12 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300">Loading commits from MongoDB...</p>
            </div>
          )}

          {/* Empty state */}
          {isDbConnected && !isLoadingCommits && persistedCommits.length === 0 && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-10 text-center space-y-3">
              <GitCommit className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Commits in Selected Repository</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No commit documents match the current repository and filter parameters in MongoDB Atlas.
              </p>
            </div>
          )}

          {/* Persisted Commits List */}
          {isDbConnected && !isLoadingCommits && persistedCommits.length > 0 && (
            <div className="space-y-3">
              {persistedCommits.map((commit) => (
                <div
                  key={commit.id || commit._id}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        {commit.shortHash || commit.hash?.slice(0, 7)}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {commit.author?.name || 'Unknown Author'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(commit.authoredDate).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {commit.sentiment?.tone && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${getSentimentBadgeClasses(
                            commit.sentiment.tone
                          )}`}
                        >
                          {commit.sentiment.tone}
                        </span>
                      )}

                      {commit.bugRisk?.level && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono capitalize ${getRiskBadgeClasses(
                            commit.bugRisk.level
                          )}`}
                        >
                          {commit.bugRisk.level}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-200">{commit.message}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                    <span>
                      +{commit.churn?.insertions ?? 0} / -{commit.churn?.deletions ?? 0} lines ({commit.churn?.filesCount ?? 0} files)
                    </span>
                    <span>Status: {commit.status}</span>
                  </div>
                </div>
              ))}

              {/* Pagination controls */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400">
                  Page <strong className="text-white">{currentPage}</strong> of{' '}
                  <strong className="text-white">{totalPages}</strong> ({totalCommitsCount} total commits)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SYNTHETIC BENCHMARK DEMO VIEW ================= */}
      {viewMode === 'demo' && (
        <div className="space-y-6">
          <DemoNoticeBadge variant="banner" />

          {/* Header and Filter Toolbar */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-indigo-400" />
                  <span>Synthetic Benchmark Commit Dataset</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Inspect synthetic ground-truth commits tagged with psychological sentiment cues and SZZ-derived defect probability.
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Showing <span className="text-white font-bold">{filteredDemoCommits.length}</span> of{' '}
                <span className="text-white font-bold">{DEMO_COMMITS.length}</span> records
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by hash, author, message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">Sentiment:</span>
                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 capitalize"
                >
                  <option value="all">All Sentiment Tones</option>
                  <option value="frustrated">Frustrated</option>
                  <option value="urgent">Urgent</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                  <option value="positive">Positive</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">Risk:</span>
                <select
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 capitalize"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="critical">Critical (&gt;85%)</option>
                  <option value="high">High (70-85%)</option>
                  <option value="moderate">Moderate (40-70%)</option>
                  <option value="low">Low (&lt;40%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Commit List / Accordion */}
          <div className="space-y-3">
            {filteredDemoCommits.map((commit) => {
              const isExpanded = expandedCommitId === commit.id;
              return (
                <div
                  key={commit.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'bg-slate-900 border-indigo-500/40 shadow-xl shadow-indigo-500/5'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div
                    onClick={() => toggleExpand(commit.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <img
                        src={commit.avatar}
                        alt={commit.author}
                        className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-slate-700"
                      />
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-400">
                            {commit.shortHash}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {commit.author}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{commit.date} ({commit.timeAgo})</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium truncate">
                          {commit.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${getSentimentBadgeClasses(
                          commit.sentiment.tone
                        )}`}
                      >
                        {commit.sentiment.tone} ({commit.sentiment.score})
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium capitalize ${getRiskBadgeClasses(
                          commit.risk.level
                        )}`}
                      >
                        {Math.round(commit.risk.probability * 100)}% {commit.risk.level}
                      </span>

                      <button
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                        aria-label="Expand commit details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-4 text-xs animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-indigo-400" />
                              <span>NLP Sentiment Analysis</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Confidence: {Math.round(commit.sentiment.confidence * 100)}%
                            </span>
                          </div>

                          <div className="space-y-1.5 text-slate-300">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Sentiment Polarity Score:</span>
                              <span className="font-mono text-white font-semibold">
                                {commit.sentiment.score} (-1.0 to +1.0)
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Stress / Crunch Indicator:</span>
                              <span className="font-mono text-amber-400 font-semibold">
                                {commit.sentiment.stressIndicator} / 100
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                              Emotional Triggers Detected:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {commit.sentiment.keywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20"
                                >
                                  &quot;{kw}&quot;
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Defect Inception Assessment</span>
                            </span>
                            <span className="font-mono text-rose-400 font-bold">
                              {Math.round(commit.risk.probability * 100)}% Fault Risk
                            </span>
                          </div>

                          <div className="space-y-1.5 text-slate-300">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Code Churn:</span>
                              <span className="font-mono">
                                <span className="text-emerald-400">+{commit.churn.insertions}</span>{' '}
                                <span className="text-rose-400">-{commit.churn.deletions}</span> across{' '}
                                <span className="text-indigo-300">{commit.churn.filesCount} files</span>
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">SZZ Inducing Candidate:</span>
                              <span
                                className={`font-semibold ${
                                  commit.isInducingCommitCandidate
                                    ? 'text-rose-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {commit.isInducingCommitCandidate ? 'Yes (Confirmed)' : 'No'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                              Causal Risk Factors:
                            </span>
                            <ul className="space-y-1 text-[11px] text-slate-300">
                              {commit.risk.factors.map((factor, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                  <span>{factor}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
