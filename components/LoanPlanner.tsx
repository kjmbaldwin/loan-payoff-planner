"use client";

import { useState, useMemo } from "react";
import {
  LoanInputs,
  LoanType,
  LumpSumInput,
  StatCard,
  CombinedChartRow,
  calculateAmortization,
  buildLumpSumMap,
  fmt,
  fmtExact,
} from "@/lib/loan";
import { LoanTypeSelector } from "@/components/LoanTypeSelector";
import { DollarInput } from "@/components/DollarInput";
import { EscrowFields } from "@/components/EscrowFields";
import { OptionalDetails } from "@/components/OptionalDetails";
import { LoanStats } from "@/components/LoanStats";
import { ProgressBar } from "@/components/ProgressBar";
import { ExtraPayments } from "@/components/ExtraPayments";
import { BalanceChart } from "@/components/BalanceChart";

const DEFAULT_INPUTS: LoanInputs = {
  loanType: "standard",
  balance: "",
  annualRate: "",
  monthlyPayment: "",
  propertyTax: "",
  insurance: "",
  startDate: "",
  openingBalance: "",
};

function parseNum(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, ""));
}

let lumpSumCounter = 0;
function newLumpSum(date = ""): LumpSumInput {
  return { id: String(++lumpSumCounter), amount: "", date };
}

export function LoanPlanner() {
  const [inputs, setInputs] = useState<LoanInputs>(DEFAULT_INPUTS);
  const [extraMonthly, setExtraMonthly] = useState("");
  const [extraMonthlyStartDate, setExtraMonthlyStartDate] = useState("");
  const [lumpSums, setLumpSums] = useState<LumpSumInput[]>([]);

  function handleChange(field: keyof LoanInputs, value: string) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  function addLumpSum() {
    setLumpSums((prev) => [...prev, newLumpSum(minLumpSumDate)]);
  }

  function removeLumpSum(id: string) {
    setLumpSums((prev) => prev.filter((ls) => ls.id !== id));
  }

  function handleLumpSumChange(id: string, field: "amount" | "date", value: string) {
    setLumpSums((prev) => prev.map((ls) => (ls.id === id ? { ...ls, [field]: value } : ls)));
  }

  const isMortgage = inputs.loanType === "mortgage";

  const monthlyEscrow = useMemo(() => {
    if (!isMortgage) return 0;
    return (parseNum(inputs.propertyTax) || 0) + (parseNum(inputs.insurance) || 0);
  }, [isMortgage, inputs.propertyTax, inputs.insurance]);

  // Fixed graph start: always current month, not affected by optional start date field
  const graphStartDate = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, []);

  const minLumpSumDate = useMemo(() => {
   const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth()).padStart(2, "0")}-01`;
  }, []);

  const minExtraMonthlyDate = useMemo(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  }, []);

  const extraMonthlyStartMonth = useMemo(() => {
    if (!extraMonthlyStartDate) return 1;
    const [year, month] = extraMonthlyStartDate.split("-").map(Number);
    const offset = (year - graphStartDate.getFullYear()) * 12 + (month - graphStartDate.getMonth());
    return Math.max(offset, 1);
  }, [extraMonthlyStartDate, graphStartDate]);

  const piPayment = useMemo(() => {
    const total = parseNum(inputs.monthlyPayment) || 0;
    return Math.max(total - monthlyEscrow, 0);
  }, [inputs.monthlyPayment, monthlyEscrow]);

  const hasPaymentError = useMemo(() => {
    const balance = parseNum(inputs.balance);
    const annualRate = parseNum(inputs.annualRate);
    if (!balance || !annualRate || !piPayment) return false;
    return piPayment <= balance * (annualRate / 100 / 12);
  }, [inputs.balance, inputs.annualRate, piPayment]);

  const hasEscrowError = useMemo(() => {
    if (!isMortgage) return false;
    const total = parseNum(inputs.monthlyPayment) || 0;
    return total > 0 && monthlyEscrow >= total;
  }, [isMortgage, inputs.monthlyPayment, monthlyEscrow]);

  // Base amortization (no extra payments)
  const schedule = useMemo(() => {
    const balance = parseNum(inputs.balance);
    const annualRate = parseNum(inputs.annualRate);
    if (!balance || !annualRate || !piPayment || balance <= 0 || annualRate <= 0 || piPayment <= 0) return null;
    return calculateAmortization(balance, annualRate, piPayment, monthlyEscrow, graphStartDate);
  }, [inputs.balance, inputs.annualRate, piPayment, monthlyEscrow, graphStartDate]);

  // Whether any extra payment inputs are filled in
  const hasExtraPayments = useMemo(() => {
    if ((parseNum(extraMonthly) || 0) > 0) return true;
    return lumpSums.some((ls) => (parseNum(ls.amount) || 0) > 0 && ls.date);
  }, [extraMonthly, lumpSums]);

  // Modified amortization (with extra payments)
  const modifiedSchedule = useMemo(() => {
    if (!schedule || !hasExtraPayments) return null;
    const balance = parseNum(inputs.balance);
    const annualRate = parseNum(inputs.annualRate);
    const extra = parseNum(extraMonthly) || 0;
    const lumpMap = buildLumpSumMap(lumpSums, graphStartDate);
    return calculateAmortization(balance, annualRate, piPayment, monthlyEscrow, graphStartDate, extra, lumpMap, extraMonthlyStartMonth);
  }, [schedule, hasExtraPayments, inputs.balance, inputs.annualRate, extraMonthly, lumpSums, piPayment, monthlyEscrow, graphStartDate, extraMonthlyStartMonth]);

  // Merge original + modified into combined chart rows, then downsample
  const combinedChartData = useMemo((): CombinedChartRow[] => {
    if (!schedule) return [];

    const modMap = new Map<number, number>();
    if (modifiedSchedule) {
      for (const row of modifiedSchedule) modMap.set(row.month, row.balance);
    }

    const combined: CombinedChartRow[] = schedule.map((row) => ({
      ...row,
      modified: modifiedSchedule
        ? (modMap.has(row.month) ? modMap.get(row.month)! : null)
        : null,
    }));

    if (combined.length <= 120) return combined;
    const step = Math.ceil(combined.length / 120);
    return combined.filter((_, i) => i % step === 0 || i === combined.length - 1);
  }, [schedule, modifiedSchedule]);

  const stats = useMemo(() => {
    if (!schedule) return null;
    const totalInterest = schedule.slice(1).reduce((sum, r) => sum + r.interest, 0);
    const totalPrincipal = schedule.slice(1).reduce((sum, r) => sum + r.principal, 0);
    const paymentsLeft = schedule.length - 1;
    const payoffDate = schedule[schedule.length - 1]?.label ?? "";
    const totalEscrow = monthlyEscrow * paymentsLeft;
    const totalPaid = totalPrincipal + totalInterest + totalEscrow;

    const opening = parseNum(inputs.openingBalance);
    const current = parseNum(inputs.balance);
    const principalPaid = opening > 0 && current > 0 && opening >= current ? opening - current : null;
    const pctPaid = principalPaid !== null && opening > 0 ? (principalPaid / opening) * 100 : null;

    return { totalInterest, totalPrincipal, totalEscrow, totalPaid, paymentsLeft, payoffDate, principalPaid, pctPaid, opening };
  }, [schedule, monthlyEscrow, inputs.openingBalance, inputs.balance]);

  // Savings from extra payments
  const savingsStats = useMemo(() => {
    if (!schedule || !modifiedSchedule) return null;
    const origMonths = schedule.length - 1;
    const modMonths = modifiedSchedule.length - 1;
    const origInterest = schedule.slice(1).reduce((sum, r) => sum + r.interest, 0);
    const modInterest = modifiedSchedule.slice(1).reduce((sum, r) => sum + r.interest, 0);
    return {
      monthsSaved: origMonths - modMonths,
      interestSaved: origInterest - modInterest,
      newPayoffDate: modifiedSchedule[modifiedSchedule.length - 1]?.label ?? "",
    };
  }, [schedule, modifiedSchedule]);

  const statCards = useMemo((): StatCard[] => {
    if (!stats) return [];
    const cards: StatCard[] = [
      { label: "Payments Left", value: `${stats.paymentsLeft} mo`, sub: `~${(stats.paymentsLeft / 12).toFixed(1)} yrs` },
      { label: "Payoff Date", value: stats.payoffDate, sub: "" },
      { label: "Total Interest", value: fmt(stats.totalInterest), sub: "" },
      { label: "Total Paid", value: fmt(stats.totalPaid), sub: isMortgage ? "incl. escrow" : "" },
    ];
    if (isMortgage && stats.totalEscrow > 0) {
      cards.push({ label: "Total Escrow Paid", value: fmt(stats.totalEscrow), sub: `${fmtExact(monthlyEscrow)}/mo` });
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
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Loan form card */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <LoanTypeSelector
          value={inputs.loanType}
          onChange={(v: LoanType) => handleChange("loanType", v)}
        />

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
                  type="text"
                  inputMode="decimal"
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

        {isMortgage && (
          <EscrowFields
            propertyTax={inputs.propertyTax}
            insurance={inputs.insurance}
            piPayment={piPayment}
            monthlyEscrow={monthlyEscrow}
            totalMonthlyPayment={parseNum(inputs.monthlyPayment) || 0}
            hasEscrowError={hasEscrowError}
            onChange={(field, value) => handleChange(field, value)}
          />
        )}

        <OptionalDetails
          startDate={inputs.startDate}
          openingBalance={inputs.openingBalance}
          onChange={(field, value) => handleChange(field, value)}
        />
      </section>

      {/* Stats */}
      {showResults && statCards.length > 0 && <LoanStats cards={statCards} />}

      {/* Progress bar */}
      {showResults && stats?.pctPaid !== null && stats?.pctPaid !== undefined && (
        <ProgressBar
          pctPaid={stats.pctPaid}
          opening={stats.opening}
          currentBalance={parseNum(inputs.balance)}
        />
      )}

      {/* Extra payments */}
      {showResults && (
        <ExtraPayments
          extraMonthly={extraMonthly}
          extraMonthlyStartDate={extraMonthlyStartDate}
          minExtraMonthlyDate={minExtraMonthlyDate}
          lumpSums={lumpSums}
          minDate={minLumpSumDate}
          onExtraMonthlyChange={setExtraMonthly}
          onExtraMonthlyStartDateChange={setExtraMonthlyStartDate}
          onAddLumpSum={addLumpSum}
          onRemoveLumpSum={removeLumpSum}
          onLumpSumChange={handleLumpSumChange}
        />
      )}

      {/* Savings summary */}
      {showResults && savingsStats && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-5">
          <p className="text-sm font-semibold text-emerald-800 mb-3">Savings with extra payments</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">Months Saved</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{savingsStats.monthsSaved}</p>
              <p className="text-xs text-emerald-600">{(savingsStats.monthsSaved / 12).toFixed(1)} years</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">Interest Saved</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{fmt(savingsStats.interestSaved)}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">New Payoff Date</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{savingsStats.newPayoffDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {showResults && combinedChartData.length > 0 && (
        <BalanceChart
          data={combinedChartData}
          isMortgage={isMortgage}
          hasModified={hasExtraPayments && modifiedSchedule !== null}
        />
      )}

      {/* Empty state */}
      {!schedule && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-base font-medium">Enter your loan details above to see your payoff plan</p>
        </div>
      )}
    </main>
  );
}
