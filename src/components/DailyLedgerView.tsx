import React, { useState, useMemo } from 'react';
import { Search, Download, Calendar, Filter, ArrowUpDown } from 'lucide-react';
import { MASRateRecord } from '../types/sora';
import { formatDate } from '../utils/soraMath';

interface DailyLedgerViewProps {
  records: MASRateRecord[];
  onSelectRecord?: (record: MASRateRecord) => void;
}

export const DailyLedgerView: React.FC<DailyLedgerViewProps> = ({ records }) => {
  const [search, setSearch] = useState('');
  const [minVolume, setMinVolume] = useState<number>(0);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.end_of_day.includes(search) ||
        r.sora.toString().includes(search) ||
        (r.calculation_method && r.calculation_method.toLowerCase().includes(search.toLowerCase()));

      const matchVolume = minVolume === 0 || (r.aggregate_volume ?? 0) >= minVolume;

      return matchSearch && matchVolume;
    });
  }, [records, search, minVolume]);

  const stats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return { avg: 0, min: 0, max: 0, totalVolume: 0 };
    }
    const rates = filteredRecords.map((r) => r.sora);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const totalVolume = filteredRecords.reduce((sum, r) => sum + (r.aggregate_volume || 0), 0);
    return { avg, min, max, totalVolume };
  }, [filteredRecords]);

  const downloadCSV = () => {
    const headers = [
      'End of Day (SGT)',
      'Overnight SORA (%)',
      '1M Compounded SORA (%)',
      '3M Compounded SORA (%)',
      '6M Compounded SORA (%)',
      'SORA Index',
      'Aggregate Volume (M SGD)',
      'Highest Rate (%)',
      'Lowest Rate (%)',
      'Calculation Method',
    ];

    const rows = filteredRecords.map((r) => [
      r.end_of_day,
      r.sora.toFixed(4),
      r.sora_compound_1m?.toFixed(4) || '',
      r.sora_compound_3m?.toFixed(4) || '',
      r.sora_compound_6m?.toFixed(4) || '',
      r.sora_index || '',
      r.aggregate_volume || '',
      r.highest_transaction_rate || '',
      r.lowest_transaction_rate || '',
      r.calculation_method || 'standard',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MAS_SORA_Daily_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">MAS SORA Daily Fixings & Historical Ledger</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Published every business day by the Monetary Authority of Singapore at 9:00 AM SGT for unsecured overnight interbank SGD transactions.
          </p>
        </div>

        <button
          onClick={downloadCSV}
          className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs">
        <div>
          <span className="text-slate-400">Average Overnight SORA</span>
          <div className="text-sm font-semibold text-white font-mono mt-0.5">
            {stats.avg.toFixed(4)}%
          </div>
        </div>
        <div>
          <span className="text-slate-400">Min Rate in Range</span>
          <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">
            {stats.min.toFixed(4)}%
          </div>
        </div>
        <div>
          <span className="text-slate-400">Max Rate in Range</span>
          <div className="text-sm font-semibold text-amber-400 font-mono mt-0.5">
            {stats.max.toFixed(4)}%
          </div>
        </div>
        <div>
          <span className="text-slate-400">Total Volume Represented</span>
          <div className="text-sm font-semibold text-white font-mono mt-0.5">
            ${stats.totalVolume.toLocaleString()}M SGD
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search dates (e.g. 2025-03)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center justify-between sm:justify-end gap-3">
          <span>{filteredRecords.length} records found</span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3">End of Day</th>
              <th className="py-2.5 px-3 text-right">Overnight SORA</th>
              <th className="py-2.5 px-3 text-right">1M Compounded</th>
              <th className="py-2.5 px-3 text-right text-emerald-400">3M Compounded</th>
              <th className="py-2.5 px-3 text-right">6M Compounded</th>
              <th className="py-2.5 px-3 text-right">SORA Index</th>
              <th className="py-2.5 px-3 text-right">Volume (SGD M)</th>
              <th className="py-2.5 px-3 text-right">Range (Low - High)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 bg-slate-900/40 font-mono tabular-nums text-slate-300">
            {filteredRecords.map((r) => {
              const dt = new Date(r.end_of_day);
              const day = dt.toLocaleDateString('en-SG', { weekday: 'short' });
              const isFriday = day === 'Fri';

              return (
                <tr key={r.end_of_day} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-sans text-white font-medium flex items-center gap-2">
                    <span>{r.end_of_day}</span>
                    <span
                      className={`text-[10px] font-sans px-1 py-0.2 rounded ${
                        isFriday ? 'bg-amber-500/10 text-amber-400 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {day}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-white font-semibold">
                    {r.sora.toFixed(4)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {r.sora_compound_1m ? `${r.sora_compound_1m.toFixed(4)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                    {r.sora_compound_3m ? `${r.sora_compound_3m.toFixed(4)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {r.sora_compound_6m ? `${r.sora_compound_6m.toFixed(4)}%` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {r.sora_index ? r.sora_index.toFixed(6) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-200">
                    {r.aggregate_volume ? `$${r.aggregate_volume.toLocaleString()}M` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                    {r.lowest_transaction_rate && r.highest_transaction_rate
                      ? `${r.lowest_transaction_rate.toFixed(2)}% - ${r.highest_transaction_rate.toFixed(2)}%`
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
