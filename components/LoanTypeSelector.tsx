import { LOAN_TYPES, LoanType } from "@/lib/loan";

interface LoanTypeSelectorProps {
  value: LoanType;
  onChange: (type: LoanType) => void;
}

export function LoanTypeSelector({ value, onChange }: LoanTypeSelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">Loan Type</p>
      <div className="grid grid-cols-2 gap-3">
        {LOAN_TYPES.map(({ value: typeValue, label, description }) => (
          <button
            key={typeValue}
            type="button"
            onClick={() => onChange(typeValue)}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${
              value === typeValue
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <p className={`text-sm font-semibold ${value === typeValue ? "text-blue-700" : "text-gray-800"}`}>
              {label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
