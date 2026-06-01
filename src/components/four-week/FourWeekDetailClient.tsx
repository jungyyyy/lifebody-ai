"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FourWeekAnalysisReport } from "@/components/four-week/FourWeekAnalysisReport";
import type { FourWeekAnalysisData } from "@/types/fourWeekAnalysis";

export function FourWeekDetailClient({ id }: { id: string }) {
  const [data, setData] = useState<{
    analysis: FourWeekAnalysisData;
    week_range: string;
    period_start: string;
    period_end: string;
    weights: { date: string; weight: number }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/four-week-analysis/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load")
      );
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-red-400">{error}</p>
        <Link href="/progress" className="mt-4 inline-block text-accent text-sm">
          ← Back to progress
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-gray-500 animate-pulse">Loading deep analysis…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 pb-24">
      <Link
        href="/progress"
        className="text-sm text-violet-300 hover:text-violet-200 mb-6 inline-block"
      >
        ← Back to progress
      </Link>
      <FourWeekAnalysisReport
        analysis={data.analysis}
        weekRange={data.week_range}
        periodStart={data.period_start}
        periodEnd={data.period_end}
        weights={data.weights}
      />
    </div>
  );
}
