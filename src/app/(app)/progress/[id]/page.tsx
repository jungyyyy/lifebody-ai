"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WeeklyAssessmentReport } from "@/components/assessment/WeeklyAssessmentReport";
import type { WeeklyAssessmentData } from "@/types/assessment";

export default function AssessmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<{
    assessment: WeeklyAssessmentData;
    period_start: string;
    period_end: string;
    week_number: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/assessment/${params.id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load")
      );
  }, [params.id]);

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
        <p className="text-gray-500 animate-pulse">Loading assessment…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 pb-24">
      <Link
        href="/progress"
        className="text-sm text-accent hover:text-accent-hover mb-6 inline-block"
      >
        ← All assessments
      </Link>
      <WeeklyAssessmentReport
        assessment={data.assessment}
        periodStart={data.period_start}
        periodEnd={data.period_end}
      />
    </div>
  );
}
