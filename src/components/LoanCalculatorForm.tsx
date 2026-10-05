import React, { useState } from 'react';
import {
  Calculator,
  Sliders,
  Sparkles,
  HelpCircle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { BenchmarkType, LoanParameters, RepaymentType } from '../types/sora';

interface LoanCalculatorFormProps {
  params: LoanParameters;
  onChange: (updated: LoanParameters) => void;
  arrearsStartDate: string;
  arrearsEndDate: string;
  onArrearsDateChange: (start: string, end: string) => void;
  onOpenArrearsModal: () => void;
}

export const LoanCalculatorForm: React.FC<LoanCalculatorFormProps> = ({
  params,
  onChange,
  arrearsStartDate,
  arrearsEndDate,
  onArrearsDateChange,
  onOpenArrearsModal,
}) => {
  const [showAffordability, setShowAffordability] = useState(false);
  const [useCustomRate, setUseCustomRate] = useState(params.customBenchmarkRate !== undefined);

  const handlePrincipalPreset = (amount: number) => {
    onChange({ ...params, principal: amount });
  };

  const handleSpreadPreset = (spread: number) => {
    onChange({ ...params, spreadPercent: spread });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Loan & Interest Parameters</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure facility size, MAS benchmark index, spread margin, and amortization tenor.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>SGD Standard</span>
          <span aria-hidden="true">·</span>
          <span>ACT/365</span>
        </div>
      </div>

      {/* Preset Loan Buttons */}
      <div>
        <label className="text-xs font-medium text-slate-300 block mb-2">
          Quick Loan Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handlePrincipalPreset(500000)}
            className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors ${
              params.principal === 500000
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-medium'
                : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">HDB Flat</div>
            <div className="font-mono font-semibold mt-0.5">$500,000</div>
          </button>

          <button
            type="button"
            onClick={() => handlePrincipalPreset(1200000)}
            className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors ${
              params.principal === 1200000
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-medium'
                : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Private Condo</div>
            <div className="font-mono font-semibold mt-0.5">$1,200,000</div>
          </button>

          <button
            type="button"
            onClick={() => handlePrincipalPreset(2500000)}
            className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors ${
              params.principal === 2500000
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-medium'
                : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Landed Home</div>
            <div className="font-mono font-semibold mt-0.5">$2,500,000</div>
          </button>

          <button
            type="button"
            onClick={() => handlePrincipalPreset(5000000)}
            className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors ${
              params.principal === 5000000
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-medium'
                : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Commercial Facility</div>
            <div className="font-mono font-semibold mt-0.5">$5,000,000</div>
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Principal Amount */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Principal Loan Amount (SGD)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
              $
            </span>
            <input
              type="number"
              min="10000"
              step="10000"
              value={params.principal || ''}
              onChange={(e) =>
                onChange({ ...params, principal: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="1,200,000"
            />
          </div>
        </div>

        {/* Benchmark Rate Type Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span>SORA Benchmark Type</span>
            <span className="text-[11px] text-slate-500">MAS Backed</span>
          </label>
          <select
            value={params.benchmarkType}
            onChange={(e) =>
              onChange({ ...params, benchmarkType: e.target.value as BenchmarkType })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          >
            <option value="3m_compounded">3-Month Compounded SORA (Retail Mortgage Standard)</option>
            <option value="1m_compounded">1-Month Compounded SORA (Frequent Monthly Reset)</option>
            <option value="6m_compounded">6-Month Compounded SORA (Semi-Annual Reset)</option>
            <option value="overnight_sora">Overnight Daily SORA (Latest MAS fixing)</option>
            <option value="daily_arrears">Daily Compounded SORA in Arrears (SC-SIBOR Formula)</option>
          </select>
        </div>

        {/* If Daily Compounded in Arrears is selected, show date range inputs */}
        {params.benchmarkType === 'daily_arrears' && (
          <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Compounding in Arrears Observation Window
              </div>
              <button
                type="button"
                onClick={onOpenArrearsModal}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium flex items-center gap-1"
              >
                Inspect Step-by-Step Compounding
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Start Date (Inclusive)
                </label>
                <input
                  type="date"
                  value={arrearsStartDate}
                  onChange={(e) => onArrearsDateChange(e.target.value, arrearsEndDate)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  End Date (Inclusive)
                </label>
                <input
                  type="date"
                  value={arrearsEndDate}
                  onChange={(e) => onArrearsDateChange(arrearsStartDate, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Calculates daily compounded rate using official MAS overnight rates weighted by calendar days (e.g. 3 days over weekends) adhering to the MAS / SC-SIBOR ACT/365 convention.
            </p>
          </div>
        )}

        {/* Bank Spread / Margin */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">
              Bank Margin / Spread (% p.a.)
            </label>
            <div className="flex items-center gap-1">
              {[0.55, 0.65, 0.75, 1.0].map((spread) => (
                <button
                  key={spread}
                  type="button"
                  onClick={() => handleSpreadPreset(spread)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    params.spreadPercent === spread
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
                  }`}
                >
                  +{spread}%
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={params.spreadPercent}
              onChange={(e) =>
                onChange({ ...params, spreadPercent: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="0.65"
            />
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
              % p.a.
            </span>
          </div>
        </div>

        {/* Floor Rate */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Interest Floor Rate (%)</span>
            <span className="text-[11px] text-slate-500">Standard: 0.00%</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={params.floorRatePercent}
              onChange={(e) =>
                onChange({ ...params, floorRatePercent: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="0.00"
            />
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
              % p.a.
            </span>
          </div>
        </div>

        {/* Loan Tenor */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Loan Tenor (Years)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[15, 20, 25, 30].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => onChange({ ...params, tenorYears: yr })}
                className={`py-2 text-xs font-mono rounded-lg border text-center transition-colors ${
                  params.tenorYears === yr
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {yr} Yrs
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="40"
              value={params.tenorYears}
              onChange={(e) =>
                onChange({ ...params, tenorYears: Math.max(1, parseInt(e.target.value) || 1) })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              placeholder="Custom years"
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">years total</span>
          </div>
        </div>

        {/* Repayment Structure */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Repayment Schedule Structure
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...params, repaymentType: 'amortizing' })}
              className={`py-2 px-3 text-xs rounded-lg border text-left transition-colors ${
                params.repaymentType === 'amortizing'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-medium'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-slate-200">Amortizing (P + I)</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Equal monthly installment</div>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...params, repaymentType: 'interest_only' })}
              className={`py-2 px-3 text-xs rounded-lg border text-left transition-colors ${
                params.repaymentType === 'interest_only'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-white font-medium'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-slate-200">Interest-Only</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Principal due at maturity</div>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Rate Override Checkbox */}
      <div className="border-t border-slate-800/80 pt-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={useCustomRate}
              onChange={(e) => {
                setUseCustomRate(e.target.checked);
                if (!e.target.checked) {
                  const updated = { ...params };
                  delete updated.customBenchmarkRate;
                  onChange(updated);
                } else {
                  onChange({ ...params, customBenchmarkRate: 3.25 });
                }
              }}
              className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
            />
            <span>Simulate / Override SORA Benchmark Rate</span>
          </label>
          <span className="text-[11px] text-slate-500">Test forward rate stress scenarios</span>
        </div>

        {useCustomRate && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Custom SORA Benchmark Rate (% p.a.)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={params.customBenchmarkRate ?? 3.25}
                onChange={(e) =>
                  onChange({
                    ...params,
                    customBenchmarkRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center">
              Replaces the latest MAS rate with this custom rate for scenario analysis.
            </div>
          </div>
        )}
      </div>

      {/* Singapore TDSR & MSR Quick Assessment (Toggleable) */}
      <div className="border-t border-slate-800/80 pt-4">
        <button
          type="button"
          onClick={() => setShowAffordability(!showAffordability)}
          className="text-xs font-medium text-slate-300 hover:text-white flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Singapore Regulatory Debt Servicing Check (TDSR / MSR)</span>
          </div>
          <span className="text-emerald-400 text-xs">
            {showAffordability ? 'Hide fields ↑' : 'Show fields ↓'}
          </span>
        </button>

        {showAffordability && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Gross Monthly Income (SGD)
              </label>
              <input
                type="number"
                step="500"
                value={params.monthlyIncome || ''}
                onChange={(e) =>
                  onChange({ ...params, monthlyIncome: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white font-mono"
                placeholder="10,000"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Other Monthly Debt Commitments (SGD)
              </label>
              <input
                type="number"
                step="100"
                value={params.otherMonthlyCommitments || ''}
                onChange={(e) =>
                  onChange({
                    ...params,
                    otherMonthlyCommitments: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white font-mono"
                placeholder="Car, credit cards, etc."
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Property Classification
              </label>
              <select
                value={params.propertyType || 'private'}
                onChange={(e) =>
                  onChange({
                    ...params,
                    propertyType: e.target.value as 'hdb' | 'private' | 'commercial',
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white"
              >
                <option value="private">Private Residential (TDSR 55%)</option>
                <option value="hdb">HDB Flat / EC (TDSR 55% + MSR 30%)</option>
                <option value="commercial">Commercial / Industrial Property</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
