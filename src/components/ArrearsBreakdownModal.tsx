import React, { useState } from 'react';
import { X, Download, HelpCircle, Calendar, Sigma, ArrowUpRight } from 'lucide-react';
import { CompoundedArrearsResult } from '../types/sora';
import { formatDate, formatPercent } from '../utils/soraMath';

interface ArrearsBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  arrearsResult: CompoundedArrearsResult;
  startDate: string;
  endDate: string;
}

export const ArrearsBreakdownModal: React.FC<ArrearsBreakdownModalProps> = ({
  isOpen,
  onClose,
  arrearsResult,
  startDate,
  endDate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredRows = arrearsResult.dailyRows.filter(
    (row) => row.date.includes(searchTerm) || row.dayOfWeek.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadDailyCSV = () => {
    const headers = [
      'Business Date',
      'Day of Week',
      'Published Overnight SORA (%)',
      'Weighting Days (n_i)',
      'Daily Factor [1 + r*n_i/365]',
      'Cumulative Compounded Product',
    ];

    const csvRows = arrearsResult.dailyRows.map((r) => [
      r.date,
      r.dayOfWeek,
      r.soraRate.toFixed(4),
      r.weightDays,
      r.dailyInterestFactor.toFixed(8),
      r.cumulativeProduct.toFixed(8),
    ]);

    const content = [
      `# MAS SORA Daily Compounding in Arrears Ledger`,
      `# Period: ${startDate} to ${endDate} | Total Calendar Days: ${arrearsResult.totalDays} | Business Days: ${arrearsResult.businessDays}`,
      `# Resulting Annualized Compounded SORA Rate: ${arrearsResult.compoundedAnnualRate.toFixed(4)}% p.a.`,
      `# Formula: [ Prod( 1 + SORA_i * n_i / 365 ) - 1 ] * (365 / d) * 100`,
      '',
      headers.join(','),
      ...csvRows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SORA_Daily_Arrears_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sigma className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Daily Compounded SORA in Arrears Breakdown
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              SC-SIBOR & MAS standard risk-free rate (RFR) compounding convention using Singapore ACT/365.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formula & Summary Callout */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/30 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto">
            <div className="text-[11px] text-slate-400 font-sans mb-1">Official MAS / SC-SIBOR Formula:</div>
            <code>
              Annualized Compounded SORA = [ ∏ (1 + (SORA_i × n_i) / 365) - 1 ] × (365 / {arrearsResult.totalDays}) × 100
            </code>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Compounded Rate</div>
              <div className="text-base font-semibold text-emerald-400 font-mono tabular-nums mt-0.5">
                {formatPercent(arrearsResult.compoundedAnnualRate, 4)} p.a.
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Interest Period</div>
              <div className="text-xs font-semibold text-white mt-0.5">
                {formatDate(startDate)} → {formatDate(endDate)}
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Calendar Days (d)</div>
              <div className="text-base font-semibold text-white font-mono tabular-nums mt-0.5">
                {arrearsResult.totalDays} Days
              </div>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Business Days (d_b)</div>
              <div className="text-base font-semibold text-white font-mono tabular-nums mt-0.5">
                {arrearsResult.businessDays} Days
              </div>
            </div>
          </div>
        </div>

        {/* Table Search & Export Controls */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Filter by date or day (e.g. 2025-03 or Fri)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white placeholder-slate-500 w-64 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <button
            onClick={downloadDailyCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Compounding Ledger (CSV)</span>
          </button>
        </div>

        {/* Scrollable Day-by-Day Table */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3 text-right">Published SORA</th>
                  <th className="py-2.5 px-3 text-right">Weight (n_i)</th>
                  <th className="py-2.5 px-3 text-right">Daily Factor (1 + r·n/365)</th>
                  <th className="py-2.5 px-3 text-right">Cumulative Product</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/60 font-mono tabular-nums text-slate-300">
                {filteredRows.map((row, idx) => (
                  <tr key={row.date} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 font-sans text-white font-medium">{row.date}</td>
                    <td className="py-2 px-3 font-sans text-slate-400">
                      <span className={row.dayOfWeek === 'Fri' ? 'text-amber-400 font-semibold' : ''}>
                        {row.dayOfWeek}
                        {row.dayOfWeek === 'Fri' ? ' (Weekend)' : ''}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-semibold">
                      {row.soraRate.toFixed(4)}%
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={row.weightDays > 1 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {row.weightDays} {row.weightDays > 1 ? 'days' : 'day'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">
                      {row.dailyInterestFactor.toFixed(8)}
                    </td>
                    <td className="py-2 px-3 text-right text-white">
                      {row.cumulativeProduct.toFixed(8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            Note: On Fridays or pre-holidays in Singapore, SORA applies through non-business days until the next Singapore business day.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
