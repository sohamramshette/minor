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
} from 'lucide-react';
import { DEMO_REPOSITORY_INFO, DEMO_METRICS } from '../utils/mockData';
import { DemoNoticeBadge } from '../components/DemoNoticeBadge';
import { fetchRepositories, registerRepository } from '../services/api';
import { ApiRepository, BackendHealth } from '../types';

interface RepositoryAnalysisPageProps {
  backendHealth?: BackendHealth | null;
  onSelectRepo?: (repoFullName: string) => void;
}

export const RepositoryAnalysisPage: React.FC<RepositoryAnalysisPageProps> = ({
  backendHealth,
  onSelectRepo,
}) => {
  const isDbConnected = backendHealth?.services?.database === 'connected';
  const [viewMode, setViewMode] = useState<'persisted' | 'demo'>(
    isDbConnected ? 'persisted' : 'demo'
  );

  const [repositories, setRepositories] = useState<ApiRepository[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const loadRepositories = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchRepositories();
      setRepositories(result.items || []);
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

  const handleQuickSeedRepo = async () => {
    setIsRegistering(true);
    try {
      await registerRepository({
        fullName: 'facebook/react',
        githubUrl: 'https://github.com/facebook/react',
        owner: 'facebook',
        name: 'react',
        defaultBranch: 'main',
        metadata: {
          description: 'The library for web and native user interfaces',
          language: 'JavaScript',
          stars: 228400,
          forks: 46200,
          openIssues: 840,
        },
      });
      await loadRepositories();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          'Failed to register repository in MongoDB. Ensure database is connected.'
      );
    } finally {
      setIsRegistering(false);
    }
  };

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
          {/* Informational banner */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Displaying real documents persisted in <strong>MongoDB Atlas</strong> collections.
                Records reflect live database state.
              </span>
            </div>
            {isDbConnected && (
              <button
                onClick={handleQuickSeedRepo}
                disabled={isRegistering}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isRegistering ? 'Registering...' : 'Register Test Repo'}</span>
              </button>
            )}
          </div>

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
                  MongoDB Atlas is ready, but no repository documents have been persisted yet. You can register a repository document below.
                </p>
              </div>
              {isDbConnected && (
                <button
                  onClick={handleQuickSeedRepo}
                  disabled={isRegistering}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isRegistering ? 'Registering...' : 'Register facebook/react Sample'}</span>
                </button>
              )}
            </div>
          )}

          {/* Repository Cards List */}
          {!isLoading && !errorMessage && repositories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repositories.map((repo) => (
                <div
                  key={repo.id || repo._id}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-colors"
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
              ))}
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
