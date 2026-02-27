import { LumpSumInput } from "@/lib/loan";
import { DollarInput } from "@/components/DollarInput";

interface ExtraPaymentsProps {
  extraMonthly: string;
  extraMonthlyStartDate: string; // "YYYY-MM-DD"
  minExtraMonthlyDate: string; // "YYYY-MM-DD" — earliest selectable date
  lumpSums: LumpSumInput[];
  minDate: string; // "YYYY-MM-DD" — earliest selectable date
  onExtraMonthlyChange: (value: string) => void;
  onExtraMonthlyStartDateChange: (value: string) => void;
  onAddLumpSum: () => void;
  onRemoveLumpSum: (id: string) => void;
  onLumpSumChange: (id: string, field: "amount" | "date", value: string) => void;
}

export function ExtraPayments({
  extraMonthly,
  extraMonthlyStartDate,
  minExtraMonthlyDate,
  lumpSums,
  minDate,
  onExtraMonthlyChange,
  onExtraMonthlyStartDateChange,
  onAddLumpSum,
  onRemoveLumpSum,
  onLumpSumChange,
}: ExtraPaymentsProps) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Extra Payments</h2>
        <p className="text-xs text-gray-400 mt-0.5">Results will be charted in green alongside your original payoff</p>
      </div>

      {/* Extra monthly */}
      <div className="flex gap-4 items-start">
        <div className="w-44">
          <DollarInput
            label="Additional monthly payment"
            placeholder="200"
            value={extraMonthly}
            onChange={onExtraMonthlyChange}
          />
        </div>
        <div className="w-44">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Starting month</label>
          <input
            type="date"
            min={minExtraMonthlyDate}
            value={extraMonthlyStartDate}
            onChange={(e) => onExtraMonthlyStartDateChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Leave blank to start now</p>
        </div>
      </div>

      {/* Lump sums */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">One-time lump sum payments</p>
          <button
            type="button"
            onClick={onAddLumpSum}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add payment
          </button>
        </div>

        {lumpSums.length === 0 && (
          <p className="text-sm text-gray-400 italic">No lump sum payments added yet.</p>
        )}

        <div className="space-y-3">
          {lumpSums.map((ls, i) => {
            const dateInvalid = !!ls.date && ls.date < minDate;

            return (
              <div key={ls.id} className="flex gap-3 items-start">
                <div className="flex-1">
                  <DollarInput
                    label={`Payment ${i + 1}`}
                    placeholder="5,000"
                    value={ls.amount}
                    onChange={(v) => onLumpSumChange(ls.id, "amount", v)}
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    min={minDate}
                    value={ls.date}
                    onChange={(e) => onLumpSumChange(ls.id, "date", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent ${
                      dateInvalid
                        ? "border-red-400 focus:ring-red-400"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                  {dateInvalid && (
                    <p className="text-red-500 text-xs mt-1">Must be a future month</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveLumpSum(ls.id)}
                  className="mt-7 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"
                  aria-label="Remove payment"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
