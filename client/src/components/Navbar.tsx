import React from 'react';
import {
  Activity,
  Github,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Layers,
} from 'lucide-react';
import { NavigationTab, BackendHealth } from '../types';

interface NavbarProps {
  currentTab: NavigationTab;
  backendHealth: BackendHealth | null;
  activeRepo: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  backendHealth,
  activeRepo,
}) => {
  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'overview':
        return 'Project Overview & Defect Correlation';
      case 'repository':
        return 'Git Repository Analytics & Code Churn';
      case 'commits':
        return 'Commit Explorer & Sentiment Labels';
      case 'risk':
        return 'Bug-Inducing Risk Analysis Engine';
      case 'sentiment':
        return 'Developer Sentiment & Emotional NLP Profiling';
      case 'investigation':
        return 'Bug Origin Tracer & Candidate Ranking';
      case 'reports':
        return 'Audit Reports & Phase 2 Checklist';
      default:
        return 'Dashboard';
    }
  };

  const isHealthy = backendHealth?.status === 'ok';

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            {getTabTitle(currentTab)}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Viewing:</span>
            <span className="font-mono text-indigo-400 font-medium">{activeRepo}</span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-400">Branch: main</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend health status badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-colors ${
            isHealthy
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          {isHealthy ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden sm:inline">Backend API:</span>
          <span className="font-semibold uppercase text-[11px]">
            {backendHealth?.status ?? 'Checking'}
          </span>
        </div>

        {/* Phase 1 Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Academic Minor • Phase 1</span>
        </div>

        {/* GitHub link button */}
        <a
          href={`https://github.com/${activeRepo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
        >
          <Github className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
};
