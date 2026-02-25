"use client";

import { useState } from "react";
import { todayString } from "@/lib/loan";
import { DollarInput } from "@/components/DollarInput";

interface OptionalDetailsProps {
  startDate: string;
  openingBalance: string;
  onChange: (field: "startDate" | "openingBalance", value: string) => void;
}

export function OptionalDetails({ startDate, openingBalance, onChange }: OptionalDetailsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {open ? "Hide" : "Show"} additional details
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Start Date
              <span className="ml-1.5 text-xs font-normal text-gray-400">optional — defaults to today</span>
            </label>
            <input
              type="date"
              value={startDate || todayString()}
              onChange={(e) => onChange("startDate", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <DollarInput
            label="Original Loan Balance"
            sublabel="optional — shows payoff progress"
            placeholder="300,000"
            value={openingBalance}
            onChange={(v) => onChange("openingBalance", v)}
          />
        </div>
      )}
    </div>
  );
}
