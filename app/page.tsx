"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type LoanType = "standard" | "mortgage";

interface LoanInputs {
  loanType: LoanType;
  balance: string;
  annualRate: string;
  monthlyPayment: string;
  propertyTax: string;
  insurance: string;
  startDate: string;
  openingBalance: string;
}

interface AmortizationRow {
  month: number;
  label: string;
  balance: number;
  principal: number;
  interest: number;
  escrow: number;
}

function calculateAmortization(
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

function fmt(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtExact(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const LOAN_TYPES: { value: LoanType; label: string; description: string }[] = [
  { value: "standard", label: "Standard", description: "Auto, personal, student — full payment goes toward P&I" },
  { value: "mortgage", label: "Mortgage", description: "Includes escrow for property tax & insurance (PITI)" },
];

function DollarInput({
  label,
  sublabel,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  sublabel?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {sublabel && <span className="ml-1.5 text-xs font-normal text-gray-400">{sublabel}</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
        <input
          type="number"
          min="0"
          step="1"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-7 pr-3 py-2.5 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
            error ? "border-red-400 focus:ring-red-400" : "border-gray-300 focus:ring-blue-500"
          }`}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: AmortizationRow }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const hasEscrow = row.escrow > 0;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm space-y-1 min-w-[170px]">
      <p className="font-semibold text-gray-700 border-b border-gray-100 pb-1 mb-1">{label}</p>
      <p className="text-blue-600 font-medium">Balance: {fmt(row.balance)}</p>
      {row.month > 0 && (
        <>
          <p className="text-gray-500">Principal: {fmtExact(row.principal)}</p>
          <p className="text-gray-500">Interest: {fmtExact(row.interest)}</p>
          {hasEscrow && <p className="text-amber-600">Escrow: {fmtExact(row.escrow)}</p>}
        </>
      )}
    </div>
  );
};

export default function Home() {
  const [inputs, setInputs] = useState<LoanInputs>({
    loanType: "standard",
    balance: "",
    annualRate: "",
    monthlyPayment: "",
    propertyTax: "",
    insurance: "",
    startDate: "",
    openingBalance: "",
  });
  const [showOptional, setShowOptional] = useState(false);

  function handleChange(field: keyof LoanInputs, value: string) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  const isMortgage = inputs.loanType === "mortgage";

  const monthlyEscrow = useMemo(() => {
    if (!isMortgage) return 0;
    return (parseFloat(inputs.propertyTax) || 0) + (parseFloat(inputs.insurance) || 0);
  }, [isMortgage, inputs.propertyTax, inputs.insurance]);

  const parsedStartDate = useMemo(() => {
    if (!inputs.startDate) return new Date();
    const [year, month, day] = inputs.startDate.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [inputs.startDate]);

  // For mortgage, the amortization only uses the P&I portion
  const piPayment = useMemo(() => {
    const total = parseFloat(inputs.monthlyPayment) || 0;
    return Math.max(total - monthlyEscrow, 0);
  }, [inputs.monthlyPayment, monthlyEscrow]);

  const hasPaymentError = useMemo(() => {
    const balance = parseFloat(inputs.balance);
    const annualRate = parseFloat(inputs.annualRate);
    if (!balance || !annualRate || !piPayment) return false;
    const monthlyRate = annualRate / 100 / 12;
    return piPayment <= balance * monthlyRate;
  }, [inputs.balance, inputs.annualRate, piPayment]);

  const hasEscrowError = useMemo(() => {
    if (!isMortgage) return false;
    const total = parseFloat(inputs.monthlyPayment) || 0;
    return total > 0 && monthlyEscrow >= total;
  }, [isMortgage, inputs.monthlyPayment, monthlyEscrow]);

  const schedule = useMemo(() => {
    const balance = parseFloat(inputs.balance);
    const annualRate = parseFloat(inputs.annualRate);
    if (!balance || !annualRate || !piPayment || balance <= 0 || annualRate <= 0 || piPayment <= 0) return null;
    return calculateAmortization(balance, annualRate, piPayment, monthlyEscrow, parsedStartDate);
  }, [inputs.balance, inputs.annualRate, piPayment, monthlyEscrow, parsedStartDate]);

  const stats = useMemo(() => {
    if (!schedule) return null;

    const totalInterest = schedule.slice(1).reduce((sum, r) => sum + r.interest, 0);
    const totalPrincipal = schedule.slice(1).reduce((sum, r) => sum + r.principal, 0);
    const paymentsLeft = schedule.length - 1;
    const payoffDate = schedule[schedule.length - 1]?.label ?? "";
    const totalEscrow = monthlyEscrow * paymentsLeft;
    const totalPaid = totalPrincipal + totalInterest + totalEscrow;

    const opening = parseFloat(inputs.openingBalance);
    const current = parseFloat(inputs.balance);
    const principalPaid = opening > 0 && current > 0 && opening >= current ? opening - current : null;
    const pctPaid = principalPaid !== null && opening > 0 ? (principalPaid / opening) * 100 : null;

    return { totalInterest, totalPrincipal, totalEscrow, totalPaid, paymentsLeft, payoffDate, principalPaid, pctPaid, opening };
  }, [schedule, monthlyEscrow, inputs.openingBalance, inputs.balance]);

  const chartData = useMemo(() => {
    if (!schedule) return [];
    if (schedule.length <= 120) return schedule;
    const step = Math.ceil(schedule.length / 120);
    return schedule.filter((_, i) => i % step === 0 || i === schedule.length - 1);
  }, [schedule]);

  const statCards = useMemo(() => {
    if (!stats) return [];
    const cards = [
      { label: "Payments Left", value: `${stats.paymentsLeft} mo`, sub: `~${(stats.paymentsLeft / 12).toFixed(1)} yrs` },
      { label: "Payoff Date", value: stats.payoffDate, sub: "" },
      { label: "Total Interest", value: fmt(stats.totalInterest), sub: "" },
      { label: "Total Paid", value: fmt(stats.totalPaid), sub: isMortgage ? "incl. escrow" : "" },
    ];
    if (isMortgage && stats.totalEscrow > 0) {
      cards.push({ label: "Total Escrow Paid", value: fmt(stats.totalEscrow), sub: `${fmt(monthlyEscrow)}/mo` });
    }
    if (stats.principalPaid !== null) {
      cards.push({ label: "Already Paid Off", value: fmt(stats.principalPaid), sub: "" });
    }
    if (stats.pctPaid !== null) {
      cards.push({ label: "% Complete", value: `${stats.pctPaid.toFixed(1)}%`, sub: `of ${fmt(stats.opening)} original` });
    }
    return cards;
  }, [stats, isMortgage, monthlyEscrow]);

  const showResults = !hasPaymentError && !hasEscrowError && schedule !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Loan Payoff Planner</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter your loan details to see your payoff timeline</p>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">

          {/* Loan type selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Loan Type</p>
            <div className="grid grid-cols-2 gap-3">
              {LOAN_TYPES.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange("loanType", value)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    inputs.loanType === value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <p className={`text-sm font-semibold ${inputs.loanType === value ? "text-blue-700" : "text-gray-800"}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Core fields */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-3">Loan Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <DollarInput
                label="Current Balance"
                placeholder="250,000"
                value={inputs.balance}
                onChange={(v) => handleChange("balance", v)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Interest Rate</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="6.5"
                    value={inputs.annualRate}
                    onChange={(e) => handleChange("annualRate", e.target.value)}
                    className="w-full pr-8 pl-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                </div>
              </div>

              <DollarInput
                label={isMortgage ? "Total Monthly Payment (PITI)" : "Monthly Payment"}
                sublabel={isMortgage ? "P&I + escrow" : undefined}
                placeholder={isMortgage ? "2,200" : "500"}
                value={inputs.monthlyPayment}
                onChange={(v) => handleChange("monthlyPayment", v)}
                error={hasPaymentError ? "P&I portion must exceed monthly interest" : undefined}
              />
            </div>
          </div>

          {/* Mortgage escrow fields */}
          {isMortgage && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-medium text-gray-700">Monthly Escrow Breakdown</p>
                {monthlyEscrow > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                    {fmtExact(monthlyEscrow)}/mo total
                  </span>
                )}
              </div>
              {hasEscrowError && (
                <p className="text-red-500 text-xs mb-3">Escrow cannot exceed the total monthly payment</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DollarInput
                  label="Monthly Property Tax"
                  sublabel="annual ÷ 12"
                  placeholder="300"
                  value={inputs.propertyTax}
                  onChange={(v) => handleChange("propertyTax", v)}
                />
                <DollarInput
                  label="Monthly Homeowner's Insurance"
                  sublabel="annual ÷ 12"
                  placeholder="120"
                  value={inputs.insurance}
                  onChange={(v) => handleChange("insurance", v)}
                />
              </div>

              {/* Payment breakdown pill */}
              {piPayment > 0 && monthlyEscrow > 0 && !hasEscrowError && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap gap-4 text-sm">
                  <span className="text-gray-500">
                    P&amp;I: <span className="font-semibold text-gray-800">{fmtExact(piPayment)}</span>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">
                    Escrow: <span className="font-semibold text-amber-600">{fmtExact(monthlyEscrow)}</span>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">
                    Total: <span className="font-semibold text-gray-800">{fmtExact(parseFloat(inputs.monthlyPayment) || 0)}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Optional section toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptional((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showOptional ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {showOptional ? "Hide" : "Show"} additional details
            </button>

            {showOptional && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Date
                    <span className="ml-1.5 text-xs font-normal text-gray-400">optional — defaults to today</span>
                  </label>
                  <input
                    type="date"
                    value={inputs.startDate || todayString()}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <DollarInput
                  label="Original Loan Balance"
                  sublabel="optional — shows payoff progress"
                  placeholder="300,000"
                  value={inputs.openingBalance}
                  onChange={(v) => handleChange("openingBalance", v)}
                />
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        {showResults && statCards.length > 0 && (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map(({ label, value, sub }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
              </div>
            ))}
          </section>
        )}

        {/* Progress bar */}
        {showResults && stats?.pctPaid !== null && stats?.pctPaid !== undefined && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Payoff Progress</span>
              <span className="text-gray-500">{stats.pctPaid.toFixed(1)}% paid</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.pctPaid, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>{fmt(stats.opening - parseFloat(inputs.balance))} paid</span>
              <span>{fmt(parseFloat(inputs.balance))} remaining</span>
            </div>
          </div>
        )}

        {/* Chart */}
        {showResults && chartData.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Balance Over Time</h2>
              {isMortgage && (
                <p className="text-xs text-gray-400">Chart shows principal balance only (excludes escrow)</p>
              )}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#balanceGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#3b82f6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Empty state */}
        {!schedule && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-base font-medium">Enter your loan details above to see your payoff plan</p>
          </div>
        )}
      </main>
    </div>
  );
}
