import { LoanPlanner } from "@/components/LoanPlanner";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Loan Payoff Planner</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter your loan details to see your payoff timeline</p>
      </header>
      <LoanPlanner />
    </div>
  );
}
