interface DollarInputProps {
  label: string;
  sublabel?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function DollarInput({ label, sublabel, placeholder, value, onChange, error }: DollarInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {sublabel && <span className="ml-1.5 text-xs font-normal text-gray-400">{sublabel}</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
        <input
          type="text"
          inputMode="decimal"
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
