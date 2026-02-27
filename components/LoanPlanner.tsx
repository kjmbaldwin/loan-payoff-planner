"use client";

import { useState } from "react";
import { LoanMeta } from "@/lib/loan";
import { LoanCard } from "@/components/LoanCard";

let loanIdCounter = 0;
function newLoanId(): string { return `loan-${++loanIdCounter}`; }

const INITIAL_ID = newLoanId();

export function LoanPlanner() {
  const [loans, setLoans] = useState<LoanMeta[]>([{ id: INITIAL_ID, name: "My Loan" }]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([INITIAL_ID]));

  function addLoan() {
    const id = newLoanId();
    setLoans((prev) => [...prev, { id, name: "New Loan" }]);
    setExpandedIds((prev) => new Set([...prev, id]));
  }

  function removeLoan(id: string) {
    setLoans((prev) => prev.filter((l) => l.id !== id));
    setExpandedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  function renameLoan(id: string, name: string) {
    setLoans((prev) => prev.map((l) => l.id === id ? { ...l, name } : l));
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-4">
      {loans.map((loan) => (
        <LoanCard
          key={loan.id}
          id={loan.id}
          name={loan.name}
          isExpanded={expandedIds.has(loan.id)}
          isDeletable={loans.length > 1}
          onRename={(name) => renameLoan(loan.id, name)}
          onToggle={() => toggleExpanded(loan.id)}
          onDelete={() => removeLoan(loan.id)}
        />
      ))}

      <button
        type="button"
        onClick={addLoan}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
      >
        + Add Loan
      </button>
    </main>
  );
}
