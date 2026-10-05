import React from 'react';
import { Database, RefreshCw, SlidersHorizontal, Layers, Calendar, BarChart3, HelpCircle } from 'lucide-react';
import { ApiConfiguration } from '../types/sora';

export type ActiveTab = 'calculator' | 'amortization' | 'ledger' | 'comparison' | 'api-integration';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  apiConfig: ApiConfiguration;
  onRefreshRates: () => void;
  isRefreshing: boolean;
  onOpenApiModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  apiConfig,
  onRefreshRates,
  isRefreshing,
  onOpenApiModal,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <a
              href="#calculator"
              onClick={(e) => {
                e.preventDefault();
                onTabChange('calculator');
              }}
              className="text-base font-semibold tracking-tight text-white hover:text-emerald-400 transition-colors"
            >
              MAS SORA Calculator
            </a>
          </div>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onTabChange('calculator')}
              className={`transition-colors whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400 py-5 -mb-px'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Calculator
            </button>
            <button
              onClick={() => onTabChange('amortization')}
              className={`transition-colors whitespace-nowrap ${
                activeTab === 'amortization'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400 py-5 -mb-px'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Amortization
            </button>
            <button
              onClick={() => onTabChange('ledger')}
              className={`transition-colors whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400 py-5 -mb-px'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daily Rates Ledger
            </button>
            <button
              onClick={() => onTabChange('comparison')}
              className={`transition-colors whitespace-nowrap ${
                activeTab === 'comparison'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400 py-5 -mb-px'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Benchmark Comparison
            </button>
            <button
              onClick={() => onTabChange('api-integration')}
              className={`transition-colors whitespace-nowrap ${
                activeTab === 'api-integration'
                  ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400 py-5 -mb-px'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Backend Integration
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshRates}
              disabled={isRefreshing}
              title="Refresh latest MAS rates"
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700/60 rounded-md hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Sync Rates</span>
            </button>

            <button
              onClick={onOpenApiModal}
              className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>API Config</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
