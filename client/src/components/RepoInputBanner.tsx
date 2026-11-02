import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Database,
  ArrowRight,
} from 'lucide-react';
import { analyzeRepository, IngestionResult } from '../services/api';
import { ApiRepository } from '../types';

interface RepoInputBannerProps {
  onAnalyze?: (repoFullName: string) => void;
  onAnalyzeSuccess?: (result: IngestionResult) => void;
  isDbConnected?: boolean;
}

export const RepoInputBanner: React.FC<RepoInputBannerProps> = ({
  onAnalyze,
  onAnalyzeSuccess,
  isDbConnected = true,
}) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [successResult, setSuccessResult] = useState<IngestionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repoUrl.trim();
    if (!trimmed) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setSuccessResult(null);

    try {
      const result = await analyzeRepository({
        url: trimmed,
        maxCommits: 30,
      });

      setSuccessResult(result);
      if (onAnalyzeSuccess) {
        onAnalyzeSuccess(result);
      }
      if (onAnalyze) {
        onAnalyze(result.repository.fullName);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to ingest repository. Ensure your GitHub URL is valid and MongoDB Atlas is reachable.';
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectPreset = (url: string) => {
    setRepoUrl(url);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-5 shadow-2xl backdrop-blur-xl">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 3 Live Ingestion
              </span>
              <span className="text-xs text-slate-400">GitHub REST API + MongoDB Atlas</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Ingest & Analyze GitHub Repository
            </h2>
            <p className="text-xs text-slate-400">
              Paste any public GitHub repository URL to retrieve real commit history, code churn stats, and persist them into MongoDB Atlas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 focus-within:border-indigo-500/60 transition-all shadow-inner">
              <div className="flex items-center gap-2 px-3 py-1.5 w-full text-slate-300">
                <GitBranch className="w-4 h-4 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="https://github.com/owner/repository"
                  className="bg-transparent w-full text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                  disabled={isAnalyzing}
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Ingesting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Analyze Repository</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center gap-2 mt-2 px-1 text-[11px] text-slate-400 overflow-x-auto">
              <span className="shrink-0 text-slate-500">Presets:</span>
              {[
                { name: 'facebook/react', url: 'https://github.com/facebook/react' },
                { name: 'pallets/flask', url: 'https://github.com/pallets/flask' },
                { name: 'torvalds/linux', url: 'https://github.com/torvalds/linux' },
                { name: 'expressjs/express', url: 'https://github.com/expressjs/express' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => handleSelectPreset(preset.url)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors shrink-0 ${
                    repoUrl === preset.url
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* Error notification banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-200 text-xs flex items-start justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-rose-300">Ingestion Failed</span>
              <p className="text-slate-300">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success notification banner */}
      {successResult && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {successResult.repository.fullName}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Stored in MongoDB
                </span>
              </div>
              <p className="text-slate-300">
                Successfully ingested <strong>{successResult.commitsIngested}</strong> new commits (
                {successResult.totalCommits} total in collection) with code churn differentials and author metadata.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {onAnalyze && (
              <button
                onClick={() => onAnalyze(successResult.repository.fullName)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Repository</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setSuccessResult(null)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
