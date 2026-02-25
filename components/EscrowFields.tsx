import { fmtExact } from "@/lib/loan";
import { DollarInput } from "@/components/DollarInput";

interface EscrowFieldsProps {
  propertyTax: string;
  insurance: string;
  piPayment: number;
  monthlyEscrow: number;
  totalMonthlyPayment: number;
  hasEscrowError: boolean;
  onChange: (field: "propertyTax" | "insurance", value: string) => void;
}

export function EscrowFields({
  propertyTax,
  insurance,
  piPayment,
  monthlyEscrow,
  totalMonthlyPayment,
  hasEscrowError,
  onChange,
}: EscrowFieldsProps) {
  return (
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
          value={propertyTax}
          onChange={(v) => onChange("propertyTax", v)}
        />
        <DollarInput
          label="Monthly Homeowner's Insurance"
          sublabel="annual ÷ 12"
          placeholder="120"
          value={insurance}
          onChange={(v) => onChange("insurance", v)}
        />
      </div>

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
            Total: <span className="font-semibold text-gray-800">{fmtExact(totalMonthlyPayment)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
