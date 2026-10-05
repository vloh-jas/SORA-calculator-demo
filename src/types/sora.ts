export interface MASRateRecord {
  end_of_day: string; // YYYY-MM-DD
  sora: number; // Daily overnight rate %
  sora_compound_1m?: number; // 1-month compounded %
  sora_compound_3m?: number; // 3-month compounded %
  sora_compound_6m?: number; // 6-month compounded %
  sora_index?: number; // SORA index
  aggregate_volume?: number; // SGD Million
  highest_transaction_rate?: number;
  lowest_transaction_rate?: number;
  calculation_method?: string;
}

export type BenchmarkType = '3m_compounded' | '1m_compounded' | '6m_compounded' | 'overnight_sora' | 'daily_arrears';

export type RepaymentType = 'amortizing' | 'interest_only';

export interface LoanParameters {
  principal: number; // SGD
  benchmarkType: BenchmarkType;
  customBenchmarkRate?: number; // override if user wishes
  spreadPercent: number; // Bank margin, e.g. 0.65%
  floorRatePercent: number; // Floor rate, e.g. 0%
  tenorYears: number; // e.g. 25
  tenorMonths: number; // e.g. 0
  repaymentType: RepaymentType;
  startDate: string; // YYYY-MM-DD
  monthlyIncome?: number; // For TDSR / MSR calculation
  otherMonthlyCommitments?: number;
  propertyType?: 'hdb' | 'private' | 'commercial';
}

export interface DailyCompoundingRow {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Mon, Tue...
  soraRate: number; // % p.a.
  weightDays: number; // n_i (e.g. 1, or 3 for Fri)
  dailyInterestFactor: number; // (1 + r * n_i / 365)
  cumulativeProduct: number;
}

export interface CompoundedArrearsResult {
  compoundedAnnualRate: number; // %
  totalDays: number;
  businessDays: number;
  dailyRows: DailyCompoundingRow[];
  formulaString: string;
}

export interface AmortizationRow {
  month: number;
  date: string;
  startingBalance: number;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  benchmarkRate: number;
  allInRate: number;
}

export interface LoanCalculationResult {
  benchmarkRate: number;
  spreadPercent: number;
  allInRate: number;
  monthlyRepayment: number;
  totalRepayment: number;
  totalInterest: number;
  effectiveInterestRatio: number; // Total interest / principal
  schedule: AmortizationRow[];
  compoundedArrearsDetail?: CompoundedArrearsResult;
  tdsrRatio?: number;
  msrRatio?: number;
  regulatoryStressMonthlyPayment?: number; // Stress tested at 4.0%
}

export interface ApiConfiguration {
  mode: 'direct_mas' | 'custom_backend' | 'preloaded';
  customBackendUrl: string;
  autoRefresh: boolean;
  lastFetchedAt: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  sourceLabel: string;
}
