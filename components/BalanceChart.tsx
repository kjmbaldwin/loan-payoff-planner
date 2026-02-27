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
import { CombinedChartRow, fmt, fmtExact } from "@/lib/loan";

interface ChartTooltipProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: readonly { payload: CombinedChartRow; name: string; color: string; [key: string]: any }[];
  label?: string | number;
  hasModified: boolean;
}

function ChartTooltip({ active, payload, label, hasModified }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const displayLabel = String(label ?? "");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm space-y-1.5 min-w-[190px]">
      <p className="font-semibold text-gray-700 border-b border-gray-100 pb-1.5 mb-0.5">{displayLabel}</p>

      <div className="space-y-1">
        <p className="text-blue-600 font-medium">
          {hasModified ? "Original: " : "Balance: "}
          {fmt(row.balance)}
        </p>
        {hasModified && row.modified !== null && (
          <p className="text-emerald-600 font-medium">With extra: {fmt(row.modified)}</p>
        )}
        {hasModified && row.modified !== null && row.balance > row.modified && (
          <p className="text-gray-400 text-xs">Saved so far: {fmt(row.balance - row.modified)}</p>
        )}
      </div>

      {row.month > 0 && (
        <div className="border-t border-gray-100 pt-1.5 space-y-0.5">
          <p className="text-gray-500">Principal: {fmtExact(row.principal)}</p>
          <p className="text-gray-500">Interest: {fmtExact(row.interest)}</p>
          {row.escrow > 0 && <p className="text-amber-600">Escrow: {fmtExact(row.escrow)}</p>}
        </div>
      )}
    </div>
  );
}

interface BalanceChartProps {
  data: CombinedChartRow[];
  isMortgage: boolean;
  hasModified: boolean;
  gradientId?: string;
}

export function BalanceChart({ data, isMortgage, hasModified, gradientId = "default" }: BalanceChartProps) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-800">Balance Over Time</h2>
        {isMortgage && (
          <p className="text-xs text-gray-400">Principal balance only (excludes escrow)</p>
        )}
      </div>

      {hasModified && (
        <div className="flex items-center gap-4 mb-5 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-blue-400 rounded" />
            Original
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-emerald-500 rounded" />
            With extra payments
          </span>
        </div>
      )}
      {!hasModified && <div className="mb-5" />}

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
          <defs>
            <linearGradient id={`${gradientId}-blue`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={`${gradientId}-green`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
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
          <Tooltip content={(props) => <ChartTooltip {...props} hasModified={hasModified} />} />

          {/* Original schedule — always rendered */}
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6"
            strokeWidth={2}
            fill={`url(#${gradientId}-blue)`}
            dot={false}
            activeDot={{ r: 5, fill: "#3b82f6" }}
            connectNulls={false}
          />

          {/* Modified schedule — only when extra payments are set */}
          {hasModified && (
            <Area
              type="monotone"
              dataKey="modified"
              stroke="#10b981"
              strokeWidth={2.5}
              fill={`url(#${gradientId}-green)`}
              dot={false}
              activeDot={{ r: 5, fill: "#10b981" }}
              connectNulls={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
