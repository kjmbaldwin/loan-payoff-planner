"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AmortizationRow, fmt, fmtExact } from "@/lib/loan";

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: AmortizationRow }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm space-y-1 min-w-[170px]">
      <p className="font-semibold text-gray-700 border-b border-gray-100 pb-1 mb-1">{label}</p>
      <p className="text-blue-600 font-medium">Balance: {fmt(row.balance)}</p>
      {row.month > 0 && (
        <>
          <p className="text-gray-500">Principal: {fmtExact(row.principal)}</p>
          <p className="text-gray-500">Interest: {fmtExact(row.interest)}</p>
          {row.escrow > 0 && <p className="text-amber-600">Escrow: {fmtExact(row.escrow)}</p>}
        </>
      )}
    </div>
  );
}

interface BalanceChartProps {
  data: AmortizationRow[];
  isMortgage: boolean;
}

export function BalanceChart({ data, isMortgage }: BalanceChartProps) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Balance Over Time</h2>
        {isMortgage && (
          <p className="text-xs text-gray-400">Chart shows principal balance only (excludes escrow)</p>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            width={55}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#balanceGradient)"
            dot={false}
            activeDot={{ r: 5, fill: "#3b82f6" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
