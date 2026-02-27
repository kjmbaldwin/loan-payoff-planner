export type LoanType = "standard" | "mortgage";

export interface LoanInputs {
  loanType: LoanType;
  balance: string;
  annualRate: string;
  monthlyPayment: string;
  propertyTax: string;
  insurance: string;
  startDate: string;
  openingBalance: string;
}

export interface AmortizationRow {
  month: number;
  label: string;
  balance: number;
  principal: number;
  interest: number;
  escrow: number;
}

// AmortizationRow extended with an optional modified balance for chart comparison
export interface CombinedChartRow extends AmortizationRow {
  modified: number | null;
}

export interface LumpSumInput {
  id: string;
  amount: string;
  date: string; // "YYYY-MM"
}

export interface LoanStats {
  totalInterest: number;
  totalPrincipal: number;
  totalEscrow: number;
  totalPaid: number;
  paymentsLeft: number;
  payoffDate: string;
  principalPaid: number | null;
  pctPaid: number | null;
  opening: number;
}

export interface StatCard {
  label: string;
  value: string;
  sub: string;
}

export const LOAN_TYPES: { value: LoanType; label: string; description: string }[] = [
  { value: "standard", label: "Standard", description: "Auto, personal, student — full payment goes toward P&I" },
  { value: "mortgage", label: "Mortgage", description: "Includes escrow for property tax & insurance (PITI)" },
];

export function calculateAmortization(
  balance: number,
  annualRate: number,
  piPayment: number,
  monthlyEscrow: number,
  startDate: Date,
  extraMonthly = 0,
  lumpSumMap: Map<number, number> = new Map(),
  extraMonthlyStartMonth = 1
): AmortizationRow[] {
  const monthlyRate = annualRate / 100 / 12;
  const rows: AmortizationRow[] = [];
  let remaining = balance;

  for (let month = 0; month <= 600; month++) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth() + month);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    if (month === 0) {
      rows.push({ month, label, balance: remaining, principal: 0, interest: 0, escrow: 0 });
      continue;
    }

    const effectiveExtra = month >= extraMonthlyStartMonth ? extraMonthly : 0;
    const interestCharge = remaining * monthlyRate;
    const regularPrincipal = Math.min(piPayment + effectiveExtra - interestCharge, remaining);

    if (regularPrincipal <= 0) break;

    remaining -= regularPrincipal;

    // Apply lump sum as additional principal after the regular payment
    const lumpSumAmount = Math.min(lumpSumMap.get(month) ?? 0, remaining);
    remaining = Math.max(remaining - lumpSumAmount, 0);

    rows.push({
      month,
      label,
      balance: remaining,
      principal: regularPrincipal + lumpSumAmount,
      interest: interestCharge,
      escrow: monthlyEscrow,
    });

    if (remaining === 0) break;
  }

  return rows;
}

/** Convert an array of LumpSumInputs into a month-offset → amount map. */
export function buildLumpSumMap(lumpSums: LumpSumInput[], startDate: Date): Map<number, number> {
  const map = new Map<number, number>();
  for (const ls of lumpSums) {
    const amount = parseFloat(ls.amount.replace(/[^0-9.]/g, ""));
    if (!ls.date || !amount || amount <= 0) continue;
    const [year, month] = ls.date.split("-").map(Number);
    const offset = (year - startDate.getFullYear()) * 12 + (month - startDate.getMonth());
    if (offset >= 1) {
      map.set(offset, (map.get(offset) ?? 0) + amount);
    }
  }
  return map;
}

export function fmt(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function fmtExact(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
