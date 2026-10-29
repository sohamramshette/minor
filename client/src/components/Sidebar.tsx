import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  GitCommit,
  ShieldAlert,
  BrainCircuit,
  Bug,
  FileText,
  Activity,
  Server,
  Database,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { NavigationTab, BackendHealth } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  backendHealth: BackendHealth | null;
  isBackendLoading: boolean;
  onRefreshHealth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  backendHealth,
  isBackendLoading,
  onRefreshHealth,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'repository', label: 'Repository Analysis', icon: GitBranch },
    { id: 'commits', label: 'Commit Explorer', icon: GitCommit, badge: '1,428' },
    { id: 'risk', label: 'Risk Analysis', icon: ShieldAlert, badge: 'SZZ Engine' },
    { id: 'sentiment', label: 'Sentiment Analysis', icon: BrainCircuit, badge: 'NLP' },
    { id: 'investigation', label: 'Bug Investigation', icon: Bug, badge: '3 Active' },
    { id: 'reports', label: 'Reports & History', icon: FileText },
  ];

  const getStatusColor = () => {
    if (!backendHealth || backendHealth.status === 'offline') return 'bg-rose-500';
    if (backendHealth.status === 'degraded') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusText = () => {
    if (isBackendLoading) return 'Connecting...';
    if (!backendHealth || backendHealth.status === 'offline') return 'API Offline';
    if (backendHealth.status === 'degraded') return 'API Degraded';
    return 'API Online';
  };

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 select-none backdrop-blur-xl z-20">
      <div>
        {/* Branding header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white font-sans">
                  Emotion<span className="text-indigo-400">Trace</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">
                Bug Origin Prediction
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      isActive
                        ? 'bg-indigo-500/40 text-white border border-indigo-400/30'
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backend API diagnostics box */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor()} animate-ping`} />
              <span className="text-xs font-medium text-slate-300">{getStatusText()}</span>
            </div>
            <button
              onClick={onRefreshHealth}
              title="Re-check backend API health"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Server className="w-3 h-3 text-slate-500" />
                <span>Express API:</span>
              </span>
              <span className="text-emerald-400 font-semibold">:5000</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-slate-500" />
                <span>MongoDB:</span>
              </span>
              <span
                className={
                  backendHealth?.services?.database === 'connected'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }
              >
                {backendHealth?.services?.database ?? 'Phase 1'}
              </span>
            </div>

            {backendHealth?.uptimeSeconds !== undefined && (
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Server Uptime:</span>
                <span>{backendHealth.uptimeSeconds}s</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className="text-[10px] text-slate-500 font-sans">
            Academic Minor Project • 2026
          </span>
        </div>
      </div>
    </aside>
  );
};
