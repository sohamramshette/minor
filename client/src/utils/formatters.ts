import { RiskLevel, SentimentTone } from '../types';

export function getRiskBadgeClasses(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-red-500/15 text-red-400 border border-red-500/30';
    case 'high':
      return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
    case 'moderate':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'low':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    default:
      return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
  }
}

export function getSentimentBadgeClasses(tone: SentimentTone): string {
  switch (tone) {
    case 'frustrated':
      return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
    case 'negative':
      return 'bg-red-500/15 text-red-300 border border-red-500/30';
    case 'urgent':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    case 'positive':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    case 'neutral':
    default:
      return 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
