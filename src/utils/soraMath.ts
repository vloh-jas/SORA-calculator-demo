import {
  AmortizationRow,
  CompoundedArrearsResult,
  DailyCompoundingRow,
  LoanCalculationResult,
  LoanParameters,
  MASRateRecord,
} from '../types/sora';

/**
 * Computes difference in calendar days between two ISO date strings (date2 - date1)
 */
export function getCalendarDayDifference(startDate: string, endDate: string): number {
  const d1 = new Date(startDate);
  const d2 = new Date(endDate);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * High-precision MAS Singapore SORA Compounding in Arrears calculation.
 * Follows the SC-SIBOR / MAS market convention using ACT/365 day count:
 * Rate = [ Prod( 1 + (SORA_i * n_i) / 36500 ) - 1 ] * (365 / d) * 100
 */
export function calculateCompoundedArrears(
  records: MASRateRecord[],
  startDate: string,
  endDate: string
): CompoundedArrearsResult {
  // Sort chronological ascending (oldest to newest)
  const sorted = [...records].sort(
    (a, b) => new Date(a.end_of_day).getTime() - new Date(b.end_of_day).getTime()
  );

  // Filter within date range inclusive
  const inRange = sorted.filter(
    (r) => r.end_of_day >= startDate && r.end_of_day <= endDate
  );

  // If filtered set is empty, fallback to latest available records
  const targetRecords = inRange.length > 0 ? inRange : sorted.slice(-30);

  const dailyRows: DailyCompoundingRow[] = [];
  let product = 1.0;
  let totalDaysCount = 0;

  for (let i = 0; i < targetRecords.length; i++) {
    const current = targetRecords[i];
    const currentDate = new Date(current.end_of_day);
    const dayOfWeekStr = currentDate.toLocaleDateString('en-SG', { weekday: 'short' });

    // Determine weighting n_i (calendar days rate applies)
    // If next record exists, n_i = difference to next record's date
    // If last record, check difference to endDate or default to 1 (or 3 if Friday)
    let weightDays = 1;
    if (i < targetRecords.length - 1) {
      const nextDate = targetRecords[i + 1].end_of_day;
      weightDays = getCalendarDayDifference(current.end_of_day, nextDate);
    } else {
      // Last record: check against requested endDate if later, else day of week
      const diffToEnd = getCalendarDayDifference(current.end_of_day, endDate);
      if (diffToEnd > 1) {
        weightDays = diffToEnd;
      } else {
        const day = currentDate.getDay(); // 5 = Friday
        weightDays = day === 5 ? 3 : 1;
      }
    }

    // Daily interest factor: 1 + (SORA_i * n_i / (365 * 100))
    const rateFraction = (current.sora / 100) * (weightDays / 365);
    const factor = 1.0 + rateFraction;
    product *= factor;
    totalDaysCount += weightDays;

    dailyRows.push({
      date: current.end_of_day,
      dayOfWeek: dayOfWeekStr,
      soraRate: current.sora,
      weightDays,
      dailyInterestFactor: factor,
      cumulativeProduct: product,
    });
  }

  const effectiveDays = Math.max(1, totalDaysCount);
  const compoundedAnnualRate = (product - 1.0) * (365 / effectiveDays) * 100;

  const formulaString = `[ ∏ (1 + SORA_i × n_i / 365) - 1 ] × (365 / ${effectiveDays}) × 100`;

  return {
    compoundedAnnualRate: Math.max(0, compoundedAnnualRate),
    totalDays: effectiveDays,
    businessDays: dailyRows.length,
    dailyRows,
    formulaString,
  };
}

/**
 * Computes monthly loan amortization and MAS debt servicing ratios
 */
export function calculateLoan(
  params: LoanParameters,
  resolvedBenchmarkRate: number,
  arrearsResult?: CompoundedArrearsResult
): LoanCalculationResult {
  const {
    principal,
    spreadPercent,
    floorRatePercent,
    tenorYears,
    tenorMonths,
    repaymentType,
    startDate,
    monthlyIncome = 0,
    otherMonthlyCommitments = 0,
  } = params;

  const totalMonths = Math.max(1, tenorYears * 12 + tenorMonths);
  const rawAllInRate = resolvedBenchmarkRate + spreadPercent;
  const allInRate = Math.max(floorRatePercent, rawAllInRate);

  // Periodic interest rate per month (r / 12)
  const monthlyRate = allInRate / 100 / 12;

  let monthlyRepayment = 0;
  if (repaymentType === 'interest_only') {
    monthlyRepayment = principal * monthlyRate;
  } else {
    // Standard Amortization formula: P * [ r(1+r)^n ] / [ (1+r)^n - 1 ]
    if (monthlyRate === 0) {
      monthlyRepayment = principal / totalMonths;
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, totalMonths);
      monthlyRepayment = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
    }
  }

  // Generate Amortization Schedule
  const schedule: AmortizationRow[] = [];
  let currentBalance = principal;
  let totalInterest = 0;
  let totalRepayment = 0;

  const startDt = new Date(startDate || new Date().toISOString().slice(0, 10));

  for (let m = 1; m <= totalMonths; m++) {
    const paymentDate = new Date(startDt);
    paymentDate.setMonth(startDt.getMonth() + m);
    const dateStr = paymentDate.toISOString().slice(0, 10);

    const interestForMonth = currentBalance * monthlyRate;
    let principalForMonth = 0;
    let actualPayment = monthlyRepayment;

    if (repaymentType === 'interest_only') {
      principalForMonth = m === totalMonths ? currentBalance : 0;
      actualPayment = interestForMonth + principalForMonth;
      currentBalance = m === totalMonths ? 0 : currentBalance;
    } else {
      principalForMonth = actualPayment - interestForMonth;
      if (m === totalMonths || currentBalance < actualPayment) {
        principalForMonth = currentBalance;
        actualPayment = principalForMonth + interestForMonth;
        currentBalance = 0;
      } else {
        currentBalance = Math.max(0, currentBalance - principalForMonth);
      }
    }

    totalInterest += interestForMonth;
    totalRepayment += actualPayment;

    schedule.push({
      month: m,
      date: dateStr,
      startingBalance: currentBalance + principalForMonth,
      payment: actualPayment,
      principal: principalForMonth,
      interest: interestForMonth,
      endingBalance: currentBalance,
      benchmarkRate: resolvedBenchmarkRate,
      allInRate,
    });
  }

  // MAS Regulatory Stress Test: Calculated at 4.0% p.a.
  const stressRate = 4.0;
  const stressMonthlyRate = stressRate / 100 / 12;
  const stressCompound = Math.pow(1 + stressMonthlyRate, totalMonths);
  const regulatoryStressMonthlyPayment =
    (principal * stressMonthlyRate * stressCompound) / (stressCompound - 1);

  // TDSR and MSR Ratios
  let tdsrRatio: number | undefined;
  let msrRatio: number | undefined;

  if (monthlyIncome > 0) {
    const totalObligations = monthlyRepayment + otherMonthlyCommitments;
    tdsrRatio = (totalObligations / monthlyIncome) * 100;
    msrRatio = (monthlyRepayment / monthlyIncome) * 100;
  }

  return {
    benchmarkRate: resolvedBenchmarkRate,
    spreadPercent,
    allInRate,
    monthlyRepayment,
    totalRepayment,
    totalInterest,
    effectiveInterestRatio: principal > 0 ? (totalInterest / principal) * 100 : 0,
    schedule,
    compoundedArrearsDetail: arrearsResult,
    tdsrRatio,
    msrRatio,
    regulatoryStressMonthlyPayment,
  };
}

/**
 * Format currency to Singapore Dollar (SGD) with commas and 2 decimals
 */
export function formatSGD(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage with configurable decimal places
 */
export function formatPercent(percent: number, decimals = 4): string {
  return `${percent.toFixed(decimals)}%`;
}

/**
 * Format ISO date string into readable Singapore date (e.g. 28 Mar 2025)
 */
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Export loan amortization schedule to CSV format
 */
export function generateAmortizationCSV(
  schedule: AmortizationRow[],
  summary: LoanCalculationResult
): string {
  const headers = [
    'Month',
    'Payment Date',
    'Starting Balance (SGD)',
    'Monthly Installment (SGD)',
    'Principal (SGD)',
    'Interest (SGD)',
    'Ending Balance (SGD)',
    'All-In Rate (%)',
  ];

  const rows = schedule.map((r) => [
    r.month,
    r.date,
    r.startingBalance.toFixed(2),
    r.payment.toFixed(2),
    r.principal.toFixed(2),
    r.interest.toFixed(2),
    r.endingBalance.toFixed(2),
    r.allInRate.toFixed(4),
  ]);

  const summaryLines = [
    `# MAS SORA Loan Repayment Schedule`,
    `# Benchmark Rate: ${summary.benchmarkRate.toFixed(4)}% | Spread: ${summary.spreadPercent.toFixed(2)}% | All-in: ${summary.allInRate.toFixed(4)}%`,
    `# Monthly Repayment: ${summary.monthlyRepayment.toFixed(2)} SGD | Total Interest: ${summary.totalInterest.toFixed(2)} SGD`,
    '',
  ];

  return [...summaryLines, headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
