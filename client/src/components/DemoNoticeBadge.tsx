import React from 'react';
import { Sparkles, Info } from 'lucide-react';

interface DemoNoticeBadgeProps {
  className?: string;
  variant?: 'banner' | 'pill';
}

export const DemoNoticeBadge: React.FC<DemoNoticeBadgeProps> = ({
  className = '',
  variant = 'pill',
}) => {
  if (variant === 'banner') {
    return (
      <div
        className={`bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-indigo-200 backdrop-blur-md shadow-lg shadow-indigo-950/20 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </span>
          <div>
            <span className="font-semibold text-white mr-1.5">Phase 1 Visual Simulation:</span>
            <span>Displaying academic baseline demo metrics. Live GitHub API extraction and MongoDB persistence activate in Phase 2.</span>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Demo Dataset
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 ${className}`}
    >
      <Info className="w-3.5 h-3.5" />
      <span>Phase 1 Demo Data</span>
    </div>
  );
};
