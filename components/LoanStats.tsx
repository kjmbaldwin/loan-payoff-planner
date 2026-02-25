import { StatCard } from "@/lib/loan";

interface LoanStatsProps {
  cards: StatCard[];
}

export function LoanStats({ cards }: LoanStatsProps) {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub }) => (
        <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      ))}
    </section>
  );
}
