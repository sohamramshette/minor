import React, { useState } from 'react';
import { GitBranch, Search, Play, CheckCircle2, AlertCircle, X, Sparkles, Terminal } from 'lucide-react';

interface RepoInputBannerProps {
  onAnalyze?: (repoUrl: string) => void;
}

export const RepoInputBanner: React.FC<RepoInputBannerProps> = ({ onAnalyze }) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setShowModal(true);
      if (onAnalyze) onAnalyze(repoUrl);
    }, 600);
  };

  const handleSelectPreset = (url: string) => {
    setRepoUrl(url);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-5 shadow-2xl backdrop-blur-xl">
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 1 Prototype
              </span>
              <span className="text-xs text-slate-400">Target Git Repository</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Analyze Repository Bug Origin & Sentiment
            </h2>
            <p className="text-xs text-slate-400">
              Provide any public GitHub repository to examine developer emotional tone and commit-level defect risks.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 focus-within:border-indigo-500/60 transition-all shadow-inner">
              <div className="flex items-center gap-2 px-3 py-1.5 w-full text-slate-300">
                <GitBranch className="w-4 h-4 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  className="bg-transparent w-full text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
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
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
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

      {/* Phase 1 Integration Placeholder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Repository Queued for Analysis</h3>
                <p className="text-xs text-indigo-400 font-mono">{repoUrl}</p>
              </div>
            </div>

            <div className="space-y-3.5 my-4 text-xs leading-relaxed text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-slate-400 space-y-1">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Phase 1 Architecture Check</span>
                </div>
                <div className="text-[11px] text-emerald-400">✓ Express backend API online (/api/health)</div>
                <div className="text-[11px] text-emerald-400">✓ Vite React + TypeScript dashboard loaded</div>
                <div className="text-[11px] text-amber-400">⏳ Live GitHub API & MongoDB ingestion scheduled for Phase 2</div>
              </div>

              <p>
                In compliance with <strong>Phase 1 specifications</strong>, this prototype runs against standardized academic baseline demonstration datasets to validate UI responsiveness and visualization pipelines.
              </p>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  The dashboard is currently illustrating the calculated sentiment and defect risk parameters for <strong>{repoUrl.replace('https://github.com/', '')}</strong>.
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Explore Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
