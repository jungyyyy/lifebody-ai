"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface FourWeekStatus {
  canShowCta: boolean;
  hasAnalysis: boolean;
  analysisId: string | null;
  weekRange: string | null;
  pendingBlockNumber: number | null;
}

export function FourWeekAnalysisCta({ className = "" }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("progress");
  const [status, setStatus] = useState<FourWeekStatus | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/four-week-analysis/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status?.canShowCta) return null;

  if (status.analysisId) {
    return (
      <Link
        href={`/progress/four-week/${status.analysisId}`}
        className={`block rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-indigo-500/10 px-4 py-3.5 transition-colors hover:from-violet-500/20 ${className}`}
      >
        <p className="text-sm font-medium text-violet-200">
          {t("fourWeekReady")}
        </p>
        <p className="text-xs text-violet-300/70 mt-0.5">
          {t("fourWeekTapRead", { range: status.weekRange ?? "" })}
        </p>
      </Link>
    );
  }

  return (
    <div
      className={`rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-indigo-500/10 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div>
        <p className="text-sm font-medium text-violet-200">{t("fourWeekReady")}</p>
        <p className="text-xs text-violet-300/70 mt-0.5">
          {t("fourWeekBlockReview", {
            range: status.weekRange ?? t("fourWeekBlockDefault"),
          })}
        </p>
      </div>
      <button
        type="button"
        disabled={generating}
        onClick={async () => {
          setGenerating(true);
          const res = await fetch("/api/four-week-analysis/generate", {
            method: "POST",
            credentials: "include",
          });
          setGenerating(false);
          if (res.ok) {
            const json = await res.json();
            router.push(`/progress/four-week/${json.id}`);
          }
        }}
        className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-50 shrink-0"
      >
        {generating ? t("generating") : t("generateAnalysis")}
      </button>
    </div>
  );
}
