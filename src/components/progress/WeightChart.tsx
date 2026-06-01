"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { addDays, localDateString } from "@/lib/dates";

interface WeightPoint {
  date: string;
  weight: number;
}

export function WeightChart({
  points,
  startWeight,
  currentWeight,
  totalChange,
  weekTrend,
  periodEnd,
  dayCount = 14,
  title = "Weight trend",
  showSummary = true,
}: {
  points: WeightPoint[];
  startWeight: number;
  currentWeight: number;
  totalChange: number;
  weekTrend: number | null;
  periodEnd?: string;
  dayCount?: number;
  title?: string;
  showSummary?: boolean;
}) {
  const chartData = useMemo(() => {
    const end = periodEnd ?? localDateString();
    const byDate = new Map(points.map((p) => [p.date, p.weight]));
    return Array.from({ length: dayCount }, (_, i) => {
      const iso = addDays(end, i - (dayCount - 1));
      const weight = byDate.get(iso);
      return {
        date: new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        weight: weight ?? null,
      };
    });
  }, [points, periodEnd, dayCount]);

  const hasAnyLog = chartData.some((d) => d.weight != null);

  const changeLabel =
    totalChange === 0
      ? "no change"
      : `${totalChange > 0 ? "+" : ""}${totalChange}kg`;

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
        {title}
      </h2>

      <div className="mt-4 h-56 w-full">
        {!hasAnyLog ? (
          <p className="text-sm text-gray-500 h-full flex items-center justify-center">
            Log your weight to see your trend
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#ffffff10" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={{ stroke: "#ffffff20" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={{ stroke: "#ffffff20" }}
                tickLine={false}
                unit=" kg"
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #ffffff20",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#9ca3af" }}
                formatter={(value) =>
                  value != null ? [`${value} kg`, "Weight"] : ["—", "Weight"]
                }
              />
              <Line
                type="linear"
                dataKey="weight"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: "#22c55e", r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {showSummary && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Starting</p>
            <p className="text-white font-medium mt-0.5">{startWeight} kg</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Current</p>
            <p className="text-accent font-medium mt-0.5">{currentWeight} kg</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Change</p>
            <p className="text-white font-medium mt-0.5">{changeLabel}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">This week</p>
            <p className="text-white font-medium mt-0.5">
              {weekTrend != null
                ? `${weekTrend > 0 ? "+" : ""}${weekTrend}kg`
                : "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
