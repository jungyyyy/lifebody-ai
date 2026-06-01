"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FourWeekStatus {
  canShowCta: boolean;
  hasAnalysis: boolean;
  analysisId: string | null;
  weekRange: string | null;
  pendingBlockNumber: number | null;
}

export function FourWeekAnalysisCta({ className = "" }: { className?: string }) {
  const router = useRouter();
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
          Your 4-Week Deep Analysis is ready 🔍
        </p>
        <p className="text-xs text-violet-300/70 mt-0.5">
          {status.weekRange} — tap to read
        </p>
      </Link>
    );
  }

  return (
    <div
      className={`rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-indigo-500/10 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div>
        <p className="text-sm font-medium text-violet-200">
          Your 4-Week Deep Analysis is ready 🔍
        </p>
        <p className="text-xs text-violet-300/70 mt-0.5">
          {status.weekRange ?? "4-week block"} — deeper patterns &amp; program review
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
        {generating ? "Analyzing…" : "Generate analysis"}
      </button>
    </div>
  );
}
