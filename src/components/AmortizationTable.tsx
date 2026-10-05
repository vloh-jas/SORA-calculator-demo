import React, { useState, useMemo } from 'react';
import {
  Download,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { AmortizationRow, LoanCalculationResult, LoanParameters } from '../types/sora';
import {
  formatDate,
  formatPercent,
  formatSGD,
  generateAmortizationCSV,
} from '../utils/soraMath';

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  summary: LoanCalculationResult;
  params: LoanParameters;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  schedule,
  summary,
  params,
}) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [searchYear, setSearchYear] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 24; // 2 years per page for monthly view

  // Annual aggregation
  const annualSummary = useMemo(() => {
    const years: Record<
      number,
      {
        yearIndex: number;
        startYearDate: string;
        startingBalance: number;
        totalPayment: number;
        totalPrincipal: number;
        totalInterest: number;
        endingBalance: number;
      }
    > = {};

    schedule.forEach((row) => {
      const yearIndex = Math.ceil(row.month / 12);
      if (!years[yearIndex]) {
        years[yearIndex] = {
          yearIndex,
          startYearDate: row.date,
          startingBalance: row.startingBalance,
          totalPayment: 0,
          totalPrincipal: 0,
          totalInterest: 0,
          endingBalance: row.endingBalance,
        };
      }
      years[yearIndex].totalPayment += row.payment;
      years[yearIndex].totalPrincipal += row.principal;
      years[yearIndex].totalInterest += row.interest;
      years[yearIndex].endingBalance = row.endingBalance;
    });

    return Object.values(years);
  }, [schedule]);

  // Filtered monthly rows
  const filteredSchedule = useMemo(() => {
    if (!searchYear) return schedule;
    return schedule.filter(
      (r) =>
        r.date.includes(searchYear) ||
        r.month.toString() === searchYear ||
        `year ${Math.ceil(r.month / 12)}`.includes(searchYear.toLowerCase())
    );
  }, [schedule, searchYear]);

  // Pagination for monthly view
  const totalPages = Math.ceil(filteredSchedule.length / pageSize);
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSchedule.slice(start, start + pageSize);
  }, [filteredSchedule, currentPage, pageSize]);

  const handleDownloadCSV = () => {
    const csvContent = generateAmortizationCSV(schedule, summary);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `SORA_Loan_Amortization_${params.principal}_${params.tenorYears}Y.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Loan Amortization Schedule</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete installment breakdown over {params.tenorYears} years ({schedule.length} months) based on SORA + {params.spreadPercent}% spread.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented view switch */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => {
                setViewMode('monthly');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly View
            </button>
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === 'annual'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Annual Summary
            </button>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 font-semibold whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs">
        <div>
          <span className="text-slate-400">Total Installments</span>
          <div className="text-sm font-semibold text-white font-mono mt-0.5">
            {schedule.length} Months
          </div>
        </div>
        <div>
          <span className="text-slate-400">Monthly Installment</span>
          <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">
            {formatSGD(summary.monthlyRepayment)}
          </div>
        </div>
        <div>
          <span className="text-slate-400">Total Cumulative Interest</span>
          <div className="text-sm font-semibold text-white font-mono mt-0.5">
            {formatSGD(summary.totalInterest)}
          </div>
        </div>
        <div>
          <span className="text-slate-400">Final Repayment Date</span>
          <div className="text-sm font-semibold text-white font-mono mt-0.5">
            {schedule[schedule.length - 1]?.date || '—'}
          </div>
        </div>
      </div>

      {/* Search Bar for Monthly View */}
      {viewMode === 'monthly' && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search year or month (e.g. 2026 or 12)..."
              value={searchYear}
              onChange={(e) => {
                setSearchYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredSchedule.length)} of{' '}
              {filteredSchedule.length} payments
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-slate-300 text-xs px-1">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="border border-slate-800 rounded-lg overflow-x-auto">
        {viewMode === 'monthly' ? (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Starting Balance</th>
                <th className="py-2.5 px-3 text-right">Payment</th>
                <th className="py-2.5 px-3 text-right text-emerald-400">Principal</th>
                <th className="py-2.5 px-3 text-right text-amber-400">Interest</th>
                <th className="py-2.5 px-3 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/40 font-mono tabular-nums text-slate-300">
              {pagedRows.map((row) => (
                <tr key={row.month} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 text-white font-medium">#{row.month}</td>
                  <td className="py-2 px-3 font-sans text-slate-400">{row.date}</td>
                  <td className="py-2 px-3 text-right text-slate-300">{formatSGD(row.startingBalance)}</td>
                  <td className="py-2 px-3 text-right text-white font-semibold">
                    {formatSGD(row.payment)}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-400">{formatSGD(row.principal)}</td>
                  <td className="py-2 px-3 text-right text-amber-400">{formatSGD(row.interest)}</td>
                  <td className="py-2 px-3 text-right text-slate-200">{formatSGD(row.endingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3 text-right">Starting Balance</th>
                <th className="py-2.5 px-3 text-right">Total Annual Payment</th>
                <th className="py-2.5 px-3 text-right text-emerald-400">Annual Principal Paid</th>
                <th className="py-2.5 px-3 text-right text-amber-400">Annual Interest Paid</th>
                <th className="py-2.5 px-3 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/40 font-mono tabular-nums text-slate-300">
              {annualSummary.map((yr) => (
                <tr key={yr.yearIndex} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-white font-medium">Year {yr.yearIndex}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{formatSGD(yr.startingBalance)}</td>
                  <td className="py-2.5 px-3 text-right text-white font-semibold">
                    {formatSGD(yr.totalPayment)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">
                    {formatSGD(yr.totalPrincipal)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-400">
                    {formatSGD(yr.totalInterest)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-200">
                    {formatSGD(yr.endingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
