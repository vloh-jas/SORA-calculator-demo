import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header, ActiveTab } from './components/Header';
import { RateTicker } from './components/RateTicker';
import { LoanCalculatorForm } from './components/LoanCalculatorForm';
import { CalculationResults } from './components/CalculationResults';
import { ArrearsBreakdownModal } from './components/ArrearsBreakdownModal';
import { AmortizationTable } from './components/AmortizationTable';
import { RateComparisonView } from './components/RateComparisonView';
import { DailyLedgerView } from './components/DailyLedgerView';
import { ApiIntegrationModal } from './components/ApiIntegrationModal';

import { INITIAL_MAS_SORA_DATA } from './data/historicalSora';
import {
  ApiConfiguration,
  BenchmarkType,
  CompoundedArrearsResult,
  LoanCalculationResult,
  LoanParameters,
  MASRateRecord,
} from './types/sora';
import { MasApiService } from './services/masApiService';
import { calculateCompoundedArrears, calculateLoan } from './utils/soraMath';
import { AlertCircle, CheckCircle2, Info, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [records, setRecords] = useState<MASRateRecord[]>(INITIAL_MAS_SORA_DATA);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isArrearsModalOpen, setIsArrearsModalOpen] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);

  // API Integration Configuration
  const [apiConfig, setApiConfig] = useState<ApiConfiguration>({
    mode: 'direct_mas',
    customBackendUrl: '',
    autoRefresh: false,
    lastFetchedAt: null,
    status: 'idle',
    sourceLabel: 'MAS eServices Public Datastore',
  });

  // Default observation dates for arrears (e.g., recent 90-day window)
  const [arrearsStartDate, setArrearsStartDate] = useState<string>('2025-01-03');
  const [arrearsEndDate, setArrearsEndDate] = useState<string>('2025-03-31');

  // Loan parameters state
  const [loanParams, setLoanParams] = useState<LoanParameters>({
    principal: 1200000,
    benchmarkType: '3m_compounded',
    spreadPercent: 0.65,
    floorRatePercent: 0.0,
    tenorYears: 25,
    tenorMonths: 0,
    repaymentType: 'amortizing',
    startDate: new Date().toISOString().slice(0, 10),
    monthlyIncome: 12000,
    otherMonthlyCommitments: 800,
    propertyType: 'private',
  });

  // Fetch rates handler
  const fetchRates = useCallback(async (currentConfig: ApiConfiguration) => {
    setIsRefreshing(true);
    try {
      const result = await MasApiService.fetchSoraRates(currentConfig);
      setRecords(result.records);
      setApiConfig((prev) => ({
        ...prev,
        lastFetchedAt: new Date().toLocaleTimeString('en-SG', { hour12: false }),
        status: result.isFallback ? 'idle' : 'success',
        sourceLabel: result.source,
        errorMessage: result.message,
      }));
    } catch (err: unknown) {
      setApiConfig((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Fetch failed',
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchRates(apiConfig);
  }, []);

  // Compute arrears if requested
  const arrearsResult: CompoundedArrearsResult = useMemo(() => {
    return calculateCompoundedArrears(records, arrearsStartDate, arrearsEndDate);
  }, [records, arrearsStartDate, arrearsEndDate]);

  // Resolve active benchmark rate
  const resolvedBenchmarkRate = useMemo(() => {
    if (loanParams.customBenchmarkRate !== undefined) {
      return loanParams.customBenchmarkRate;
    }

    const latest = MasApiService.getLatestBenchmarks(records);

    switch (loanParams.benchmarkType) {
      case '1m_compounded':
        return latest.compound1M;
      case '3m_compounded':
        return latest.compound3M;
      case '6m_compounded':
        return latest.compound6M;
      case 'overnight_sora':
        return latest.overnightSora;
      case 'daily_arrears':
        return arrearsResult.compoundedAnnualRate;
      default:
        return latest.compound3M;
    }
  }, [records, loanParams.benchmarkType, loanParams.customBenchmarkRate, arrearsResult]);

  // Calculate loan results
  const calculationResult: LoanCalculationResult = useMemo(() => {
    return calculateLoan(
      loanParams,
      resolvedBenchmarkRate,
      loanParams.benchmarkType === 'daily_arrears' ? arrearsResult : undefined
    );
  }, [loanParams, resolvedBenchmarkRate, arrearsResult]);

  // Handler to test backend connection from modal
  const handleTestBackend = async () => {
    if (!apiConfig.customBackendUrl) {
      return { success: false, message: 'URL cannot be empty', count: 0 };
    }
    const testConfig: ApiConfiguration = {
      ...apiConfig,
      mode: 'custom_backend',
    };
    const res = await MasApiService.fetchSoraRates(testConfig);
    if (!res.isFallback && res.records.length > 0) {
      return {
        success: true,
        message: 'Successfully fetched and validated records from backend endpoint',
        count: res.records.length,
      };
    }
    return {
      success: false,
      message: res.message || 'No valid SORA records returned',
      count: 0,
    };
  };

  const handleBenchmarkSelectFromTicker = (type: BenchmarkType) => {
    setLoanParams((prev) => {
      const updated = { ...prev, benchmarkType: type };
      delete updated.customBenchmarkRate;
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header (Zone 1, 2, 3 Contract) */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'api-integration') {
            setIsApiModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        apiConfig={apiConfig}
        onRefreshRates={() => fetchRates(apiConfig)}
        isRefreshing={isRefreshing}
        onOpenApiModal={() => setIsApiModalOpen(true)}
      />

      {/* Live Benchmark Rates Strip */}
      <RateTicker
        records={records}
        apiConfig={apiConfig}
        selectedBenchmark={loanParams.benchmarkType}
        onSelectBenchmark={handleBenchmarkSelectFromTicker}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Status Callout if fallback or backend notification */}
        {apiConfig.errorMessage && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs flex items-center justify-between gap-3 text-slate-300">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Data source: <strong className="text-slate-100">{apiConfig.sourceLabel}</strong> · {apiConfig.errorMessage}
              </span>
            </div>
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-medium underline whitespace-nowrap"
            >
              Configure Backend
            </button>
          </div>
        )}

        {/* Tab 1: Calculator Main View */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Controls (7 cols) */}
              <div className="lg:col-span-7">
                <LoanCalculatorForm
                  params={loanParams}
                  onChange={setLoanParams}
                  arrearsStartDate={arrearsStartDate}
                  arrearsEndDate={arrearsEndDate}
                  onArrearsDateChange={(start, end) => {
                    setArrearsStartDate(start);
                    setArrearsEndDate(end);
                  }}
                  onOpenArrearsModal={() => setIsArrearsModalOpen(true)}
                />
              </div>

              {/* Right Column: Dynamic Results & Visualizations (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <CalculationResults
                  result={calculationResult}
                  params={loanParams}
                  onViewAmortization={() => setActiveTab('amortization')}
                  onViewArrearsBreakdown={() => setIsArrearsModalOpen(true)}
                  onViewComparison={() => setActiveTab('comparison')}
                />
              </div>
            </div>

            {/* Quick SORA Guide & Market Mechanics Section */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-xs text-slate-400">
              <h3 className="text-sm font-semibold text-white mb-2">
                Singapore SORA Benchmark Standards & Calculation Conventions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 leading-relaxed">
                <div>
                  <div className="text-slate-300 font-medium mb-1">SC-SIBOR Transition</div>
                  <p>
                    SORA fully replaced SOR and SIBOR as the sole key SGD interest rate benchmark. Published daily at 9:00 AM SGT by the Monetary Authority of Singapore (MAS).
                  </p>
                </div>
                <div>
                  <div className="text-slate-300 font-medium mb-1">Day Count: ACT/365</div>
                  <p>
                    Singapore SGD loans utilize the ACT/365 convention. Friday fixing carries through Sunday (3 calendar days weighting $n_i = 3$) in daily compounding formulas.
                  </p>
                </div>
                <div>
                  <div className="text-slate-300 font-medium mb-1">Compounding in Advance vs Arrears</div>
                  <p>
                    Retail home loans commonly utilize published 1M/3M Compounded SORA in advance. Commercial & syndicated loans compound daily overnight fixings in arrears.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Tab 2: Amortization Schedule */}
        {activeTab === 'amortization' && (
          <AmortizationTable
            schedule={calculationResult.schedule}
            summary={calculationResult}
            params={loanParams}
          />
        )}

        {/* Tab 3: Historical SORA Ledger */}
        {activeTab === 'ledger' && (
          <DailyLedgerView records={records} />
        )}

        {/* Tab 4: Benchmark Comparison */}
        {activeTab === 'comparison' && (
          <RateComparisonView
            params={loanParams}
            records={records}
            onApplyBenchmark={(type) => {
              setLoanParams((prev) => ({
                ...prev,
                benchmarkType: type,
              }));
              setActiveTab('calculator');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>MAS Singapore Overnight Rate Average (SORA) Calculator</span>
            <span aria-hidden="true">·</span>
            <span>ACT/365 Day Count</span>
          </div>
          <div>
            Rates published under the Singapore Open Data Licence. For financial planning & facility settlement.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ArrearsBreakdownModal
        isOpen={isArrearsModalOpen}
        onClose={() => setIsArrearsModalOpen(false)}
        arrearsResult={arrearsResult}
        startDate={arrearsStartDate}
        endDate={arrearsEndDate}
      />

      <ApiIntegrationModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        config={apiConfig}
        onSaveConfig={(updated) => {
          setApiConfig(updated);
          fetchRates(updated);
        }}
        onTestConnection={handleTestBackend}
      />
    </div>
  );
}
