"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface AssessmentStatus {
  weekNumber: number;
  isSunday: boolean;
  hasAssessment: boolean;
  assessmentId: string | null;
  ready: boolean;
}

export function AssessmentBanner() {
  const t = useTranslations("premium");
  const tProgress = useTranslations("progress");
  const [status, setStatus] = useState<AssessmentStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const autoTriggered = useRef(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/assessment/status");
      const s: AssessmentStatus = await res.json();
      setStatus(s);

      if (s.isSunday && !s.hasAssessment && !autoTriggered.current) {
        autoTriggered.current = true;
        setGenerating(true);
        const genRes = await fetch("/api/assessment/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        setGenerating(false);
        if (genRes.ok) {
          const json = await genRes.json();
          setStatus({
            ...s,
            hasAssessment: true,
            ready: true,
            assessmentId: json.id,
          });
        }
      }
    }
    load();
  }, []);

  if (!status) return null;

  if (generating) {
    return (
      <div className="mb-6 rounded-xl border border-white/10 bg-card px-4 py-3 text-sm text-gray-400 animate-pulse">
        {tProgress("preparingAssessment", { week: status.weekNumber })}
      </div>
    );
  }

  if (status.isSunday && status.ready && status.assessmentId) {
    return (
      <Link
        href={`/progress/${status.assessmentId}`}
        className="mb-6 block rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 transition-colors hover:bg-accent/15"
      >
        <p className="text-sm font-medium text-accent">
          {t("weekAssessmentReady", { week: status.weekNumber })}
        </p>
      </Link>
    );
  }

  if (!status.isSunday && !status.hasAssessment) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-white/15 bg-card/50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-400">{tProgress("wantWeeklyReport")}</p>
        <ManualGenerateButton
          weekNumber={status.weekNumber}
          onDone={(id) =>
            setStatus((s) =>
              s
                ? {
                    ...s,
                    hasAssessment: true,
                    ready: true,
                    assessmentId: id,
                  }
                : s
            )
          }
        />
      </div>
    );
  }

  return null;
}

function ManualGenerateButton({
  weekNumber,
  onDone,
}: {
  weekNumber: number;
  onDone: (id: string) => void;
}) {
  const t = useTranslations("assessment");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/assessment/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setLoading(false);
    if (res.ok) {
      const json = await res.json();
      onDone(json.id);
    }
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading}
      className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
    >
      {loading ? t("generating") : t("generateWeek", { week: weekNumber })}
    </button>
  );
}
