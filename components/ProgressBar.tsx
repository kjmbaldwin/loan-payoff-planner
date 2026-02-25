import { fmt } from "@/lib/loan";

interface ProgressBarProps {
  pctPaid: number;
  opening: number;
  currentBalance: number;
}

export function ProgressBar({ pctPaid, opening, currentBalance }: ProgressBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">Payoff Progress</span>
        <span className="text-gray-500">{pctPaid.toFixed(1)}% paid</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="bg-blue-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pctPaid, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1.5">
        <span>{fmt(opening - currentBalance)} paid</span>
        <span>{fmt(currentBalance)} remaining</span>
      </div>
    </div>
  );
}
