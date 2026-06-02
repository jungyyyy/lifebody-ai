"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { OnboardingLayout } from "./OnboardingLayout";
import { ErrorBanner, PrimaryButton, StepTitle } from "./ui";
import { Step1BasicStats } from "./steps/Step1BasicStats";
import { Step2GoalBody } from "./steps/Step2GoalBody";
import { Step3BodyDescription } from "./steps/Step3BodyDescription";
import { Step4Assessment } from "./steps/Step4Assessment";
import { Step5LossRate } from "./steps/Step5LossRate";
import { Step5Lifestyle } from "./steps/Step5Lifestyle";
import { Step6ProgramGen } from "./steps/Step6ProgramGen";
import { Step7Premium } from "./steps/Step7Premium";
import { validateStep } from "@/lib/onboarding/validation";
import {
  calculateProgramWeeks,
  weightToLoseKg,
} from "@/lib/program/duration";
import {
  INITIAL_ONBOARDING_DATA,
  type BodyAssessment,
  type OnboardingFormData,
} from "@/types/onboarding";

export function OnboardingWizard() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tVal = useTranslations("validation");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingFormData>(INITIAL_ONBOARDING_DATA);
  const [error, setError] = useState<string | null>(null);

  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const assessmentFetched = useRef(false);

  const [programPhase, setProgramPhase] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [programError, setProgramError] = useState<string | null>(null);
  const programFetched = useRef(false);

  const programWeeks = useMemo(() => {
    if (!data.assessment) return 12;
    const w = parseFloat(data.currentWeightKg);
    const rate = parseFloat(data.weeklyLossRateKg || "0.6");
    return calculateProgramWeeks(
      weightToLoseKg(w, data.assessment.goal_weight_kg),
      rate
    );
  }, [data.assessment, data.currentWeightKg, data.weeklyLossRateKg]);

  const fetchAssessment = useCallback(async () => {
    setAssessmentLoading(true);
    setAssessmentError(null);
    try {
      const res = await fetch("/api/onboarding/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("assessmentFailed"));
      setData((d) => ({
        ...d,
        assessment: json.assessment as BodyAssessment,
      }));
    } catch (err) {
      setAssessmentError(
        err instanceof Error ? err.message : t("assessmentFailed")
      );
    } finally {
      setAssessmentLoading(false);
    }
  }, [data, t]);

  const fetchProgram = useCallback(async () => {
    setProgramPhase("loading");
    setProgramError(null);
    const minDelay = new Promise((r) => setTimeout(r, 3000));
    try {
      const [res] = await Promise.all([
        fetch("/api/onboarding/program", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
        minDelay,
      ]);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("programFailed"));
      setProgramPhase("done");
    } catch (err) {
      setProgramPhase("error");
      setProgramError(
        err instanceof Error ? err.message : t("programFailed")
      );
    }
  }, [data, t]);

  useEffect(() => {
    if (step === 4 && !assessmentFetched.current && !data.assessment) {
      assessmentFetched.current = true;
      fetchAssessment();
    }
  }, [step, data.assessment, fetchAssessment]);

  useEffect(() => {
    if (step === 7 && !programFetched.current && programPhase === "idle") {
      programFetched.current = true;
      fetchProgram();
    }
  }, [step, programPhase, fetchProgram]);

  function goNext() {
    const validationKey = validateStep(step, data);
    if (validationKey) {
      setError(tVal(validationKey));
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  const stepMeta: Record<number, { title: string; subtitle?: string }> = {
    1: { title: t("step1Title"), subtitle: t("step1Subtitle") },
    2: { title: t("step2Title"), subtitle: t("step2Subtitle") },
    3: { title: t("step3Title"), subtitle: t("step3Subtitle") },
    4: { title: t("step4Title") },
    5: { title: t("step5Title"), subtitle: t("step5Subtitle") },
    6: { title: t("step6Title"), subtitle: t("step6Subtitle") },
    7: { title: t("step7Title") },
    8: { title: t("step8Title") },
  };

  const meta = stepMeta[step];
  const showNav = step <= 3 || step === 5 || step === 6;

  return (
    <OnboardingLayout step={step}>
      {meta && step !== 7 && (
        <StepTitle title={meta.title} subtitle={meta.subtitle} />
      )}

      {error && showNav && <ErrorBanner message={error} />}

      {step === 1 && <Step1BasicStats data={data} setData={setData} />}
      {step === 2 && <Step2GoalBody data={data} setData={setData} />}
      {step === 3 && <Step3BodyDescription data={data} setData={setData} />}
      {step === 4 && (
        <Step4Assessment
          data={data}
          loading={assessmentLoading}
          error={assessmentError}
          onReady={() => setStep(5)}
        />
      )}
      {step === 5 && <Step5LossRate data={data} setData={setData} />}
      {step === 6 && <Step5Lifestyle data={data} setData={setData} />}
      {step === 7 && (
        <Step6ProgramGen
          programWeeks={programWeeks}
          phase={programPhase === "idle" ? "loading" : programPhase}
          error={programError}
          onShowProgram={() => setStep(8)}
        />
      )}
      {step === 8 && (
        <>
          {error && <ErrorBanner message={error} />}
          <Step7Premium programWeeks={programWeeks} onboardingData={data} />
        </>
      )}

      {showNav && (
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              {tCommon("back")}
            </button>
          )}
          <div className={step > 1 ? "flex-1" : "w-full"}>
            <PrimaryButton onClick={goNext}>{tCommon("next")}</PrimaryButton>
          </div>
        </div>
      )}

      {step === 4 && assessmentError && !assessmentLoading && (
        <div className="mt-4">
          <PrimaryButton
            onClick={() => {
              assessmentFetched.current = false;
              fetchAssessment();
            }}
          >
            {t("retryAnalysis")}
          </PrimaryButton>
        </div>
      )}

      {step === 7 && programPhase === "error" && (
        <div className="mt-4">
          <PrimaryButton
            onClick={() => {
              programFetched.current = false;
              setProgramPhase("idle");
              programFetched.current = true;
              fetchProgram();
            }}
          >
            {t("retryProgram")}
          </PrimaryButton>
        </div>
      )}
    </OnboardingLayout>
  );
}
