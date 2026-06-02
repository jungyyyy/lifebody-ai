"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface AssessmentStatus {
  weekNumber: number;
  canShowCta: boolean;
  hasAssessment: boolean;
  assessmentId: string | null;
}

export function WeeklyAssessmentCta({ className = "" }: { className?: string }) {
  const t = useTranslations("premium");
  const tAssessment = useTranslations("assessment");
  const [status, setStatus] = useState<AssessmentStatus | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/assessment/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status?.canShowCta) return null;

  if (status.hasAssessment && status.assessmentId) {
    return (
      <Link
        href={`/progress/${status.assessmentId}`}
        className={`block rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 transition-colors hover:bg-accent/15 ${className}`}
      >
        <p className="text-sm font-medium text-accent">
          {t("weekAssessmentReady", { week: status.weekNumber })}
        </p>
      </Link>
    );
  }

  return (
    <div
      className={`rounded-xl border border-white/10 bg-card px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <p className="text-sm text-gray-300">
        {t("weekReportReady", { week: status.weekNumber })}
      </p>
      <button
        type="button"
        disabled={generating}
        onClick={async () => {
          setGenerating(true);
          const res = await fetch("/api/assessment/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({}),
          });
          setGenerating(false);
          if (res.ok) {
            const json = await res.json();
            setStatus((s) =>
              s
                ? {
                    ...s,
                    hasAssessment: true,
                    assessmentId: json.id,
                  }
                : s
            );
          }
        }}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {generating ? tAssessment("creating") : tAssessment("createWeeklyReport")}
      </button>
    </div>
  );
}
