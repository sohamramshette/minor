import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Star,
  GitFork,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Code2,
  Database,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  ChevronRight,
  GitCommit,
  Clock,
  Layers,
  Search,
} from 'lucide-react';
import { DEMO_REPOSITORY_INFO, DEMO_METRICS } from '../utils/mockData';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { RepoInputBanner } from '../components/RepoInputBanner';
import { fetchRepositories, fetchRepositoryCommits, registerRepository } from '../services/api';
import { ApiRepository, ApiCommit, BackendHealth, NavigationTab } from '../types';

interface RepositoryAnalysisPageProps {
  backendHealth?: BackendHealth | null;
  activeRepoFullName?: string;
  onSelectRepo?: (repoFullName: string) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const RepositoryAnalysisPage: React.FC<RepositoryAnalysisPageProps> = ({
  backendHealth,
  activeRepoFullName,
  onSelectRepo,
  onNavigateTab,
}) => {
  const isDbConnected = backendHealth?.services?.database === 'connected';
  const [viewMode, setViewMode] = useState<'persisted' | 'demo'>(
    isDbConnected ? 'persisted' : 'demo'
  );

  const [repositories, setRepositories] = useState<ApiRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<ApiRepository | null>(null);
  const [recentCommits, setRecentCommits] = useState<ApiCommit[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState<boolean>(false);
  const [repoSearch, setRepoSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRepositories = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchRepositories();
      const items = result.items || [];
      setRepositories(items);

      if (items.length > 0) {
        let current = items[0];
        if (activeRepoFullName) {
          const matched = items.find(
            (r) => r.fullName.toLowerCase() === activeRepoFullName.toLowerCase()
          );
          if (matched) current = matched;
        }
        setSelectedRepo(current);
      } else {
        setSelectedRepo(null);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (isDbConnected
          ? 'Failed to fetch repositories from MongoDB Atlas.'
          : 'MongoDB is currently unconfigured or offline.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'persisted') {
      loadRepositories();
    }
  }, [viewMode, isDbConnected]);

  // Load preview commits when selected repository changes
  useEffect(() => {
    if (selectedRepo && viewMode === 'persisted') {
      const repoId = selectedRepo.id || (selectedRepo as any)._id;
      setIsLoadingCommits(true);
      fetchRepositoryCommits(repoId, { limit: 5 })
        .then((res) => {
          setRecentCommits(res.items || []);
        })
        .catch(() => {
          setRecentCommits([]);
        })
        .finally(() => {
          setIsLoadingCommits(false);
        });
    }
  }, [selectedRepo, viewMode]);

  const handleRepoClick = (repo: ApiRepository) => {
    setSelectedRepo(repo);
    if (onSelectRepo) {
      onSelectRepo(repo.fullName);
    }
  };

  const handleIngestionSuccess = async () => {
    await loadRepositories();
  };

  const filteredRepos = repositories.filter((r) => {
    if (!repoSearch.trim()) return true;
    const term = repoSearch.toLowerCase();
    return (
      r.fullName.toLowerCase().includes(term) ||
      r.owner.toLowerCase().includes(term) ||
      r.name.toLowerCase().includes(term) ||
      (r.metadata?.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* View Mode & Database Status Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
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
              <span>MongoDB Atlas Records</span>
              {repositories.length > 0 && viewMode === 'persisted' && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/30 text-indigo-200">
                  {repositories.length}
                </span>
              )}
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
              <span>Synthetic Benchmark Demo</span>
            </button>
          </div>
        </div>

        {/* Database connectivity status pill */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono ${
              isDbConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : backendHealth?.services?.database === 'unconfigured'
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDbConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>
              MongoDB:{' '}
              <strong className="capitalize">
                {backendHealth?.services?.database ?? 'unconfigured'}
              </strong>
            </span>
          </div>

          {viewMode === 'persisted' && (
            <button
              onClick={loadRepositories}
              disabled={isLoading}
              title="Refresh repositories"
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* ================= PERSISTED MONGODB VIEW ================= */}
      {viewMode === 'persisted' && (
        <div className="space-y-6">
          {/* Phase 3 GitHub Repository Ingestion Banner */}
          <RepoInputBanner
            onAnalyzeSuccess={handleIngestionSuccess}
            onAnalyze={(name) => {
              if (onSelectRepo) onSelectRepo(name);
              loadRepositories();
            }}
            isDbConnected={isDbConnected}
          />

          {/* Loading State */}
          {isLoading && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-white">Loading repositories from MongoDB Atlas...</p>
              <p className="text-xs text-slate-400">Querying collections via Express REST API</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && errorMessage && (
            <div className="rounded-2xl bg-rose-950/20 border border-rose-900/40 p-6 space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold">Database Query Error</h4>
              </div>
              <p className="text-xs text-slate-300">{errorMessage}</p>
              <div className="pt-2 text-xs text-slate-400 space-y-1 font-mono">
                <p>Ensure your MongoDB Atlas cluster is online and MONGODB_URI is specified in .env:</p>
                <code className="text-indigo-300 block bg-slate-950 p-2 rounded">
                  MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/emotiontrace
                </code>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setViewMode('demo')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
                >
                  View Synthetic Benchmark Demo Instead
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !errorMessage && repositories.length === 0 && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Repositories Stored in Database</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  MongoDB Atlas is ready, but no repository documents have been persisted yet. Paste a GitHub repository URL into the ingestion banner above to retrieve real commits.
                </p>
              </div>
            </div>
          )}

          {/* Active Repository Detailed Metadata & Commit Insights */}
          {!isLoading && !errorMessage && selectedRepo && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-indigo-500/30 p-6 shadow-xl space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>MongoDB Persisted Record</span>
                      </span>
                      <span className="text-xs font-mono uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Status: {selectedRepo.status}
                      </span>
                    </div>

                    <h2 className="text-2xl font-extrabold text-white font-mono tracking-tight flex items-center gap-3">
                      <span>{selectedRepo.fullName}</span>
                      <a
                        href={selectedRepo.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                        title="Open on GitHub"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </h2>

                    <p className="text-xs text-slate-300 max-w-2xl">
                      {selectedRepo.metadata?.description || 'No repository description available.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>{(selectedRepo.metadata?.stars ?? 0).toLocaleString()} stars</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                      <GitFork className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{(selectedRepo.metadata?.forks ?? 0).toLocaleString()} forks</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>{selectedRepo.metadata?.openIssues ?? 0} issues</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="block text-[11px] text-slate-500">Default Branch</span>
                    <span className="font-mono text-sm font-bold text-indigo-300">
                      {selectedRepo.defaultBranch || 'main'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="block text-[11px] text-slate-500">Primary Language</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {selectedRepo.metadata?.language || 'JavaScript'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="block text-[11px] text-slate-500">Commits Collected</span>
                    <span className="font-mono text-sm font-bold text-white">
                      {(selectedRepo.commitCount ?? recentCommits.length ?? 0)} stored
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="block text-[11px] text-slate-500">Last Ingested</span>
                    <span className="font-mono text-xs font-semibold text-slate-300">
                      {selectedRepo.analyzedAt
                        ? new Date(selectedRepo.analyzedAt).toLocaleDateString()
                        : 'Recently'}
                    </span>
                  </div>
                </div>

                {/* Navigation CTA to Commit Explorer */}
                {onNavigateTab && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400">
                      Explore detailed code churn, diffs, and commit records stored in MongoDB:
                    </span>
                    <button
                      onClick={() => onNavigateTab('commits')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                    >
                      <GitCommit className="w-4 h-4" />
                      <span>Open in Commit Explorer</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Ingested Commits Preview */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <GitCommit className="w-4 h-4 text-indigo-400" />
                      <span>Recent Commits Persisted for {selectedRepo.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Actual records from MongoDB collection &apos;commits&apos;
                    </p>
                  </div>
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('commits')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                    >
                      <span>View All in Explorer</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isLoadingCommits && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin mx-auto mb-1" />
                    Loading commit records...
                  </div>
                )}

                {!isLoadingCommits && recentCommits.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No commits found for this repository. Try re-analyzing or refreshing.
                  </div>
                )}

                {!isLoadingCommits && recentCommits.length > 0 && (
                  <div className="space-y-2">
                    {recentCommits.map((commit) => (
                      <div
                        key={commit.id || commit._id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-400">
                              {commit.shortHash || commit.hash?.substring(0, 7)}
                            </span>
                            <span className="font-medium text-white truncate">
                              {commit.author?.name || 'Unknown'}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(commit.authoredDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-300 truncate font-sans">{commit.message}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
                          <span className="text-emerald-400">+{commit.churn?.insertions ?? 0}</span>
                          <span className="text-rose-400">-{commit.churn?.deletions ?? 0}</span>
                          <span className="text-slate-500">
                            ({commit.churn?.filesCount ?? 0} files)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stored Repositories Catalog & Filter */}
          {!isLoading && !errorMessage && repositories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>All Persisted Repositories ({repositories.length})</span>
                </h3>

                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder="Search stored repositories..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRepos.map((repo) => {
                  const isCurrent =
                    (selectedRepo?.id || (selectedRepo as any)?._id) ===
                    (repo.id || (repo as any)._id);
                  return (
                    <div
                      key={repo.id || repo._id}
                      onClick={() => handleRepoClick(repo)}
                      className={`rounded-2xl border p-5 space-y-4 cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-500/10'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white truncate">
                              {repo.fullName}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {repo.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {repo.metadata?.description || 'No description provided'}
                          </p>
                        </div>

                        <a
                          href={repo.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                        <div className="p-2 rounded-lg bg-slate-950/60 text-slate-400">
                          <span className="block text-[10px] text-slate-500">Stars</span>
                          <span className="font-mono font-bold text-amber-400">
                            {(repo.metadata?.stars ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 text-slate-400">
                          <span className="block text-[10px] text-slate-500">Branch</span>
                          <span className="font-mono font-bold text-indigo-300">
                            {repo.defaultBranch || 'main'}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 text-slate-400">
                          <span className="block text-[10px] text-slate-500">Language</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {repo.metadata?.language || 'JavaScript'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>ID: {(repo.id || repo._id || '').slice(0, 10)}...</span>
                        <span>Created: {new Date(repo.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SYNTHETIC BENCHMARK DEMO VIEW ================= */}
      {viewMode === 'demo' && (
        <div className="space-y-6">
          <DemoNoticeBadge variant="banner" />

          {/* Repository Profile Header */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/30 border border-slate-800 p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    Synthetic Ground Truth Dataset
                  </span>
                  <span className="text-xs text-slate-500">SZZ AST + VADER Benchmark</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white font-mono tracking-tight">
                  {DEMO_REPOSITORY_INFO.fullName}
                </h2>
                <p className="text-xs text-slate-400 max-w-xl">
                  Analyzing historical git commit tree, code churn differentials, and author emotional trajectories for vulnerability inception.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>{DEMO_REPOSITORY_INFO.stars.toLocaleString()} stars</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                  <GitFork className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{DEMO_REPOSITORY_INFO.forks.toLocaleString()} forks</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{DEMO_REPOSITORY_INFO.openIssues} open issues</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Repository Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Branch & Scan Summary */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>Branch Architecture</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Default Target:</span>
                  <span className="font-mono text-indigo-300 font-semibold">main</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Total Commits Analyzed:</span>
                  <span className="font-mono text-white font-bold">{DEMO_METRICS.totalCommits}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Last Scanned:</span>
                  <span className="font-mono text-slate-300">{DEMO_REPOSITORY_INFO.lastScanTimestamp}</span>
                </div>
              </div>
            </div>

            {/* Code Churn & Volume */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>Code Churn Metrics</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Insertions (+):</span>
                  <span className="font-mono text-emerald-400 font-bold">+84,210 lines</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Deletions (-):</span>
                  <span className="font-mono text-rose-400 font-bold">-32,840 lines</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Churn Velocity:</span>
                  <span className="font-mono text-amber-400 font-semibold">High (Sprint crunch)</span>
                </div>
              </div>
            </div>

            {/* Repository Defect Proneness Rating */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Defect Proneness Assessment</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Calculated Vulnerability Index:</span>
                  <span className="font-mono text-amber-400 font-bold">Moderate (42/100)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">High-Churn Critical Files:</span>
                  <span className="font-mono text-rose-400 font-semibold">8 files</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Identified Bug Origins:</span>
                  <span className="font-mono text-emerald-400 font-bold">{DEMO_METRICS.detectedBugOrigins} confirmed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Language Composition Breakdown */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>Language Breakdown & Codebase Composition</span>
            </h3>

            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden flex">
              <div className="bg-yellow-400 h-full" style={{ width: '68%' }} title="JavaScript 68%" />
              <div className="bg-blue-500 h-full" style={{ width: '24%' }} title="TypeScript 24%" />
              <div className="bg-indigo-400 h-full" style={{ width: '5%' }} title="C++ 5%" />
              <div className="bg-slate-600 h-full" style={{ width: '3%' }} title="Other 3%" />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="text-slate-300">JavaScript</span>
                <span className="text-slate-500 font-mono">68.2%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-300">TypeScript</span>
                <span className="text-slate-500 font-mono">24.5%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span className="text-slate-300">C++</span>
                <span className="text-slate-500 font-mono">4.9%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span className="text-slate-300">Other</span>
                <span className="text-slate-500 font-mono">2.4%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
