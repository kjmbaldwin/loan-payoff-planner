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
  startDate: Date
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

    const interestCharge = remaining * monthlyRate;
    const principalPayment = Math.min(piPayment - interestCharge, remaining);

    if (principalPayment <= 0) break;

    remaining = Math.max(remaining - principalPayment, 0);
    rows.push({ month, label, balance: remaining, principal: principalPayment, interest: interestCharge, escrow: monthlyEscrow });

    if (remaining === 0) break;
  }

  return rows;
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
