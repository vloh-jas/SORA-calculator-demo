import React, { useState } from 'react';
import { Layers, ArrowRight, ShieldCheck, Check, Info } from 'lucide-react';
import { LoanParameters, MASRateRecord } from '../types/sora';
import { MasApiService } from '../services/masApiService';
import { formatPercent, formatSGD } from '../utils/soraMath';

interface RateComparisonViewProps {
  params: LoanParameters;
  records: MASRateRecord[];
  onApplyBenchmark: (type: '1m_compounded' | '3m_compounded' | '6m_compounded') => void;
}

interface BenchmarkPackageCard {
  label: string;
  benchmarkRate: number;
  allInRate: number;
  monthlyPayment: number;
  interest3Yr: number;
  interest5Yr: number;
  totalInterest: number;
  id: string;
  tag: string;
  reset: string;
  isPopular?: boolean;
  isFixedRate?: boolean;
}

export const RateComparisonView: React.FC<RateComparisonViewProps> = ({
  params,
  records,
  onApplyBenchmark,
}) => {
  const benchmarks = MasApiService.getLatestBenchmarks(records);
  const [fixedRateOverride, setFixedRateOverride] = useState<number>(3.05);

  const totalMonths = Math.max(1, params.tenorYears * 12 + params.tenorMonths);

  const calculatePackage = (rateBenchmark: number, label: string, isFixed = false) => {
    const allIn = isFixed ? rateBenchmark : Math.max(params.floorRatePercent, rateBenchmark + params.spreadPercent);
    const monthlyRate = allIn / 100 / 12;

    let monthlyPayment = 0;
    if (params.repaymentType === 'interest_only') {
      monthlyPayment = params.principal * monthlyRate;
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
      monthlyPayment = (params.principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
    }

    // Approximate 3-year and 5-year interest
    let balance = params.principal;
    let interest3Yr = 0;
    let interest5Yr = 0;

    for (let m = 1; m <= Math.min(60, totalMonths); m++) {
      const intMonth = balance * monthlyRate;
      if (m <= 36) interest3Yr += intMonth;
      interest5Yr += intMonth;

      if (params.repaymentType === 'amortizing') {
        const prinMonth = monthlyPayment - intMonth;
        balance = Math.max(0, balance - prinMonth);
      }
    }

    const totalInterest = monthlyPayment * totalMonths - params.principal;

    return {
      label,
      benchmarkRate: rateBenchmark,
      allInRate: allIn,
      monthlyPayment,
      interest3Yr,
      interest5Yr,
      totalInterest: Math.max(0, totalInterest),
    };
  };

  const package1M = calculatePackage(benchmarks.compound1M, '1-Month Compounded SORA');
  const package3M = calculatePackage(benchmarks.compound3M, '3-Month Compounded SORA');
  const package6M = calculatePackage(benchmarks.compound6M, '6-Month Compounded SORA');
  const packageFixed = calculatePackage(fixedRateOverride, 'Fixed Rate Mortgage', true);

  const packages: BenchmarkPackageCard[] = [
    { ...package1M, id: '1m_compounded', tag: 'Fastest market tracking', reset: 'Monthly' },
    { ...package3M, id: '3m_compounded', tag: 'Singapore Mortgage Standard', reset: 'Quarterly', isPopular: true },
    { ...package6M, id: '6m_compounded', tag: 'High rate stability', reset: 'Semi-Annually' },
    { ...packageFixed, id: 'fixed', tag: 'Lock-in protection', reset: 'Fixed Tenor', isFixedRate: true },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Singapore Loan Benchmark Comparison</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate cashflow impact across 1M SORA, 3M SORA, 6M SORA, and Fixed Rate facilities on a {formatSGD(params.principal)} loan.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <label className="text-slate-400">Fixed Rate Benchmark:</label>
          <div className="relative">
            <input
              type="number"
              step="0.05"
              value={fixedRateOverride}
              onChange={(e) => setFixedRateOverride(parseFloat(e.target.value) || 0)}
              className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono text-right"
            />
            <span className="ml-1 text-slate-400">%</span>
          </div>
        </div>
      </div>

      {/* Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
              pkg.isPopular
                ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm relative'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              {/* Header Label */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{pkg.label}</span>
                {pkg.isPopular && (
                  <span className="text-[10px] text-emerald-400 font-medium">Most Popular</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{pkg.tag}</div>

              {/* All-in Rate */}
              <div className="mt-4 pt-3 border-t border-slate-850">
                <div className="text-[11px] text-slate-400">All-In Effective Rate</div>
                <div className="text-2xl font-bold text-white font-mono tabular-nums mt-0.5">
                  {formatPercent(pkg.allInRate, 3)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {pkg.isFixedRate
                    ? 'Guaranteed fixed rate'
                    : `SORA (${pkg.benchmarkRate.toFixed(4)}%) + ${params.spreadPercent}%`}
                </div>
              </div>

              {/* Monthly Repayment */}
              <div className="mt-4 pt-3 border-t border-slate-850">
                <div className="text-[11px] text-slate-400">Monthly Installment</div>
                <div className="text-lg font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
                  {formatSGD(pkg.monthlyPayment)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Reset Cadence: <span className="text-slate-300">{pkg.reset}</span>
                </div>
              </div>

              {/* 3-Year & 5-Year Interest Cost */}
              <div className="mt-4 pt-3 border-t border-slate-850 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">3-Year Interest:</span>
                  <span className="font-mono text-white text-[11px]">{formatSGD(pkg.interest3Yr)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">5-Year Interest:</span>
                  <span className="font-mono text-white text-[11px]">{formatSGD(pkg.interest5Yr)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
                  <span className="text-slate-400 text-[11px]">Lifetime Interest:</span>
                  <span className="font-mono text-slate-300 text-[11px]">{formatSGD(pkg.totalInterest)}</span>
                </div>
              </div>
            </div>

            {/* Selection Button */}
            {!pkg.isFixedRate && (
              <button
                type="button"
                onClick={() =>
                  onApplyBenchmark(
                    pkg.id as '1m_compounded' | '3m_compounded' | '6m_compounded'
                  )
                }
                className={`mt-5 w-full py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  params.benchmarkType === pkg.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {params.benchmarkType === pkg.id ? 'Currently Selected' : 'Apply to Calculator'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Institutional Explanatory Callout */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 text-xs text-slate-400 space-y-2">
        <div className="text-slate-200 font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          Which SORA Benchmark should you choose?
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div>
            <div className="text-slate-300 font-medium">1M Compounded SORA</div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Resets monthly. When market interest rates are decreasing, borrowers benefit quickest from lower monthly installments.
            </p>
          </div>
          <div>
            <div className="text-slate-300 font-medium">3M Compounded SORA</div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Standard Singapore retail mortgage benchmark (DBS, OCBC, UOB). Offers an optimal balance of smoothing short-term rate spikes while tracking macro trends.
            </p>
          </div>
          <div>
            <div className="text-slate-300 font-medium">Fixed Rate Packages</div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Fixed interest for 2–3 years. Ideal for conservative borrowers seeking complete cashflow predictability against global volatility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
