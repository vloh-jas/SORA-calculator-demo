import React, { useState } from 'react';
import {
  TrendingUp,
  Percent,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { LoanCalculationResult, LoanParameters } from '../types/sora';
import { formatPercent, formatSGD } from '../utils/soraMath';

interface CalculationResultsProps {
  result: LoanCalculationResult;
  params: LoanParameters;
  onViewAmortization: () => void;
  onViewArrearsBreakdown?: () => void;
  onViewComparison: () => void;
}

export const CalculationResults: React.FC<CalculationResultsProps> = ({
  result,
  params,
  onViewAmortization,
  onViewArrearsBreakdown,
  onViewComparison,
}) => {
  const [stressShift, setStressShift] = useState<number>(0);

  // Calculate dynamic stress shifted monthly payment
  const shiftedAllIn = Math.max(
    params.floorRatePercent,
    result.allInRate + stressShift
  );
  const totalMonths = Math.max(1, params.tenorYears * 12 + params.tenorMonths);
  const shiftedMonthlyRate = shiftedAllIn / 100 / 12;

  let shiftedMonthlyPayment = 0;
  if (params.repaymentType === 'interest_only') {
    shiftedMonthlyPayment = params.principal * shiftedMonthlyRate;
  } else {
    const factor = Math.pow(1 + shiftedMonthlyRate, totalMonths);
    shiftedMonthlyPayment = (params.principal * shiftedMonthlyRate * factor) / (factor - 1);
  }

  const paymentDifference = shiftedMonthlyPayment - result.monthlyRepayment;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Payment & Interest Summary</h2>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>SGD Loan Facility</span>
            <span aria-hidden="true">·</span>
            <span>{params.tenorYears} Years Tenor</span>
            <span aria-hidden="true">·</span>
            <span>{params.repaymentType === 'amortizing' ? 'Amortizing (P+I)' : 'Interest Only'}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">All-In Interest Rate</div>
          <div className="text-lg font-semibold text-emerald-400 font-mono tabular-nums">
            {formatPercent(result.allInRate, 4)}
          </div>
        </div>
      </div>

      {/* Primary KPI Hero Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Monthly Repayment Hero Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 relative overflow-hidden">
          <div className="text-xs font-medium text-slate-400">Monthly Repayment</div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums mt-1 tracking-tight">
            {formatSGD(result.monthlyRepayment)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="font-mono text-emerald-400 font-medium">
              {formatSGD(result.monthlyRepayment * 12)} / year
            </span>
          </div>
        </div>

        {/* All-in Rate Breakdown Hero Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Rate Composition</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-white font-mono tabular-nums">
              {formatPercent(result.allInRate, 4)}
            </span>
            <span className="text-xs text-slate-400">p.a.</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-2 font-mono">
            <span>SORA {formatPercent(result.benchmarkRate, 4)}</span>
            <span>+</span>
            <span className="text-slate-300">Spread {formatPercent(result.spreadPercent, 2)}</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-3 border-t border-b border-slate-800/80 py-4">
        <div>
          <div className="text-[11px] text-slate-400">Total Interest</div>
          <div className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
            {formatSGD(result.totalInterest)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {result.effectiveInterestRatio.toFixed(1)}% of principal
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400">Total Loan Outflow</div>
          <div className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
            {formatSGD(result.totalRepayment)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            P + I Over {params.tenorYears} yrs
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400">Principal Amount</div>
          <div className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
            {formatSGD(params.principal)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {params.tenorYears * 12} Installments
          </div>
        </div>
      </div>

      {/* Visual Principal vs Interest Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
          <span>Repayment Breakdown</span>
          <span>
            Principal: {((params.principal / (result.totalRepayment || 1)) * 100).toFixed(0)}% ·
            Interest: {((result.totalInterest / (result.totalRepayment || 1)) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          <div
            style={{
              width: `${(params.principal / (result.totalRepayment || 1)) * 100}%`,
            }}
            className="bg-emerald-500 transition-all duration-300"
            title="Principal"
          />
          <div
            style={{
              width: `${(result.totalInterest / (result.totalRepayment || 1)) * 100}%`,
            }}
            className="bg-amber-500 transition-all duration-300"
            title="Interest"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Principal: {formatSGD(params.principal)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Total Interest: {formatSGD(result.totalInterest)}
          </span>
        </div>
      </div>

      {/* Singapore Regulatory Affordability Assessment (TDSR / MSR) if income entered */}
      {params.monthlyIncome && params.monthlyIncome > 0 ? (
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 space-y-2">
          <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Singapore Regulatory Debt Servicing Check
            </span>
            <span className="text-[11px] text-slate-400 font-normal">MAS Framework</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            {/* TDSR */}
            <div className="border border-slate-800/80 rounded p-2 bg-slate-900/40">
              <div className="text-[11px] text-slate-400">Total Debt Servicing Ratio (TDSR)</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm font-semibold font-mono text-white">
                  {result.tdsrRatio?.toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-500">Cap: 55%</span>
              </div>
              <div className="text-[10px] mt-1">
                {(result.tdsrRatio ?? 0) <= 55 ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Within MAS 55% limit
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Exceeds MAS 55% limit
                  </span>
                )}
              </div>
            </div>

            {/* MSR (for HDB/EC) */}
            <div className="border border-slate-800/80 rounded p-2 bg-slate-900/40">
              <div className="text-[11px] text-slate-400">Mortgage Servicing Ratio (MSR)</div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm font-semibold font-mono text-white">
                  {result.msrRatio?.toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-500">Cap: 30% (HDB)</span>
              </div>
              <div className="text-[10px] mt-1">
                {params.propertyType === 'hdb' ? (
                  (result.msrRatio ?? 0) <= 30 ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Within HDB 30% MSR
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Exceeds 30% HDB MSR
                    </span>
                  )
                ) : (
                  <span className="text-slate-500">N/A (Private Property)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* SORA Rate Sensitivity & MAS Stress Test Slider */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Rate Sensitivity Stress Test</span>
          <span className="font-mono text-emerald-400">
            {stressShift >= 0 ? `+${stressShift.toFixed(2)}%` : `${stressShift.toFixed(2)}%`} shift
          </span>
        </div>

        <input
          type="range"
          min="-1.5"
          max="3.0"
          step="0.25"
          value={stressShift}
          onChange={(e) => setStressShift(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Stressed Rate: {formatPercent(shiftedAllIn, 2)}</span>
          <span className="font-mono text-white">
            Stressed Monthly: {formatSGD(shiftedMonthlyPayment)}
          </span>
          <span
            className={`font-mono text-[10px] ${
              paymentDifference >= 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {paymentDifference >= 0 ? `+${formatSGD(paymentDifference)}` : formatSGD(paymentDifference)} / mo
          </span>
        </div>

        {/* MAS Regulatory Stress Reference (4.0% p.a.) */}
        {result.regulatoryStressMonthlyPayment && (
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/60 flex items-center justify-between">
            <span>MAS Medium-Term Stress Test (at 4.00% p.a.):</span>
            <span className="font-mono text-slate-300">
              {formatSGD(result.regulatoryStressMonthlyPayment)} / month
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          type="button"
          onClick={onViewAmortization}
          className="flex-1 py-2 px-3 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>View Full Amortization Schedule</span>
        </button>

        {params.benchmarkType === 'daily_arrears' && onViewArrearsBreakdown && (
          <button
            type="button"
            onClick={onViewArrearsBreakdown}
            className="py-2 px-3 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Inspect Daily Arrears Math</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onViewComparison}
          className="py-2 px-3 text-xs font-medium text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Compare Tenors</span>
        </button>
      </div>
    </div>
  );
};
