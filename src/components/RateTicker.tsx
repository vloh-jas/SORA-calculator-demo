import React from 'react';
import { TrendingUp, Clock, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ApiConfiguration, MASRateRecord } from '../types/sora';
import { MasApiService } from '../services/masApiService';
import { formatDate } from '../utils/soraMath';

interface RateTickerProps {
  records: MASRateRecord[];
  apiConfig: ApiConfiguration;
  onSelectBenchmark?: (type: '3m_compounded' | '1m_compounded' | '6m_compounded' | 'overnight_sora') => void;
  selectedBenchmark?: string;
}

export const RateTicker: React.FC<RateTickerProps> = ({
  records,
  apiConfig,
  onSelectBenchmark,
  selectedBenchmark,
}) => {
  const benchmarks = MasApiService.getLatestBenchmarks(records);

  return (
    <section className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Metadata info */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span className="font-medium text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Monetary Authority of Singapore (MAS)
          </span>
          <span aria-hidden="true">·</span>
          <span>End of Day: {formatDate(benchmarks.latestDate)}</span>
          <span aria-hidden="true">·</span>
          <span>Day Count: ACT/365</span>
          <span aria-hidden="true">·</span>
          <span>Daily Publication: 09:00 SGT</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-300">
            Volume: {benchmarks.aggregateVolume.toLocaleString()}M SGD
          </span>
        </div>

        {/* Right: Quick Benchmark Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onSelectBenchmark?.('overnight_sora')}
            className={`text-left p-2.5 rounded-lg border transition-all ${
              selectedBenchmark === 'overnight_sora'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-400 truncate">Overnight SORA</div>
            <div className="text-base font-semibold text-white font-mono tabular-nums">
              {benchmarks.overnightSora.toFixed(4)}%
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectBenchmark?.('1m_compounded')}
            className={`text-left p-2.5 rounded-lg border transition-all ${
              selectedBenchmark === '1m_compounded'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-400 truncate">1M Compounded</div>
            <div className="text-base font-semibold text-white font-mono tabular-nums">
              {benchmarks.compound1M.toFixed(4)}%
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectBenchmark?.('3m_compounded')}
            className={`text-left p-2.5 rounded-lg border transition-all ${
              selectedBenchmark === '3m_compounded'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-medium text-emerald-400 truncate">
              3M Compounded (Default)
            </div>
            <div className="text-base font-semibold text-white font-mono tabular-nums">
              {benchmarks.compound3M.toFixed(4)}%
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectBenchmark?.('6m_compounded')}
            className={`text-left p-2.5 rounded-lg border transition-all ${
              selectedBenchmark === '6m_compounded'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-400 truncate">6M Compounded</div>
            <div className="text-base font-semibold text-white font-mono tabular-nums">
              {benchmarks.compound6M.toFixed(4)}%
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
