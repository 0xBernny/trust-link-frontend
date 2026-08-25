"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { VendorAnalyticsPoint } from "@/lib/api";
import { useCurrency } from "@/components/providers/CurrencyProvider";

function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatAxisLabel(value: string, compact: boolean): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", compact
    ? { month: "numeric", day: "numeric" }
    : { month: "short", day: "numeric" }
  );
}

function formatCompactVolume(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function normalizeRate(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value <= 1 ? value * 100 : value;
}

function AnalyticsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: VendorAnalyticsPoint }>;
  label?: string;
}) {
  const { formatAmount } = useCurrency();
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/95 p-4 text-sm shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <p className="font-semibold text-zinc-950 dark:text-white">
        {label ? formatAxisLabel(label, false) : "Daily snapshot"}
      </p>
      <div className="mt-3 space-y-1 text-zinc-600 dark:text-zinc-300">
        <p>Transaction volume: {formatAmount(point.transactionVolume)}</p>
        <p>Average order: {formatAmount(point.averageOrderValue)}</p>
        <p>Completion rate: {formatRate(normalizeRate(point.completionRate))}</p>
        <p>Dispute rate: {formatRate(normalizeRate(point.disputeRate))}</p>
      </div>
    </div>
  );
}

interface VendorAnalyticsChartProps {
  data: VendorAnalyticsPoint[];
  isMobile: boolean;
}

export default function VendorAnalyticsChart({
  data,
  isMobile,
}: VendorAnalyticsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="volumeStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B2A6B" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#7B68EE" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B2A6B" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#7B68EE" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.18)" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          interval={isMobile ? 5 : 2}
          minTickGap={isMobile ? 24 : 16}
          tickFormatter={(value: string | number) => formatAxisLabel(String(value), isMobile)}
          tick={{ fill: "#71717a", fontSize: isMobile ? 11 : 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          width={isMobile ? 44 : 64}
          tickFormatter={(value: string | number) => formatCompactVolume(Number(value))}
          tick={{ fill: "#71717a", fontSize: isMobile ? 11 : 12 }}
        />
        <Tooltip content={<AnalyticsTooltip />} />
        <Line
          type="monotone"
          dataKey="transactionVolume"
          stroke="url(#volumeStroke)"
          strokeWidth={3}
          fill="url(#volumeFill)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
