"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "./OnboardingLayout";
import { ErrorBanner, PrimaryButton, StepTitle } from "./ui";
import { Step1BasicStats } from "./steps/Step1BasicStats";
import { Step2GoalBody } from "./steps/Step2GoalBody";
import { Step3BodyDescription } from "./steps/Step3BodyDescription";
import { Step4Assessment } from "./steps/Step4Assessment";
import { Step5Lifestyle } from "./steps/Step5Lifestyle";
import { Step6ProgramGen } from "./steps/Step6ProgramGen";
import { Step7Premium } from "./steps/Step7Premium";
import { validateStep } from "@/lib/onboarding/validation";
import {
  INITIAL_ONBOARDING_DATA,
  type BodyAssessment,
  type OnboardingFormData,
} from "@/types/onboarding";

const STEP_TITLES: Record<number, { title: string; subtitle?: string }> = {
  1: {
    title: "Let's get started",
    subtitle: "Tell us your name and basic stats so we can personalize your plan.",
  },
  2: {
    title: "What's your goal body?",
    subtitle: "Choose the physique you're working toward.",
  },
  3: {
    title: "Describe your current body",
    subtitle:
      "Be as honest as you like — this is private and helps us build your plan.",
  },
  4: { title: "Your body assessment" },
  5: {
    title: "Your lifestyle",
    subtitle: "This helps us build a program that fits your real life.",
  },
  6: { title: "Building your program" },
  7: { title: "Unlock your program" },
};

export function OnboardingWizard() {
  const router = useRouter();
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

  const [completing, setCompleting] = useState(false);

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
      if (!res.ok) throw new Error(json.error ?? "Assessment failed");

      setData((d) => ({
        ...d,
        assessment: json.assessment as BodyAssessment,
      }));
    } catch (err) {
      setAssessmentError(
        err instanceof Error ? err.message : "Assessment failed"
      );
    } finally {
      setAssessmentLoading(false);
    }
  }, [data]);

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
      if (!res.ok) throw new Error(json.error ?? "Program generation failed");

      setProgramPhase("done");
    } catch (err) {
      setProgramPhase("error");
      setProgramError(
        err instanceof Error ? err.message : "Program generation failed"
      );
    }
  }, [data]);

  useEffect(() => {
    if (step === 4 && !assessmentFetched.current && !data.assessment) {
      assessmentFetched.current = true;
      fetchAssessment();
    }
  }, [step, data.assessment, fetchAssessment]);

  useEffect(() => {
    if (
      step === 6 &&
      !programFetched.current &&
      programPhase === "idle"
    ) {
      programFetched.current = true;
      fetchProgram();
    }
  }, [step, programPhase, fetchProgram]);

  function goNext() {
    const validationError = validateStep(step, data);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleComplete() {
    setCompleting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not complete onboarding");

      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCompleting(false);
    }
  }

  const meta = STEP_TITLES[step];
  const showNav = step <= 3 || step === 5;

  return (
    <OnboardingLayout step={step}>
      {meta && step !== 6 && (
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
      {step === 5 && <Step5Lifestyle data={data} setData={setData} />}
      {step === 6 && (
        <Step6ProgramGen
          phase={programPhase === "idle" ? "loading" : programPhase}
          error={programError}
          onShowProgram={() => setStep(7)}
        />
      )}
      {step === 7 && (
        <>
          {error && <ErrorBanner message={error} />}
          <Step7Premium onStartTrial={handleComplete} loading={completing} />
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
              Back
            </button>
          )}
          <div className={step > 1 ? "flex-1" : "w-full"}>
            <PrimaryButton onClick={goNext}>Next →</PrimaryButton>
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
            Retry analysis
          </PrimaryButton>
        </div>
      )}

      {step === 6 && programPhase === "error" && (
        <div className="mt-4">
          <PrimaryButton
            onClick={() => {
              programFetched.current = false;
              setProgramPhase("idle");
              programFetched.current = true;
              fetchProgram();
            }}
          >
            Retry program generation
          </PrimaryButton>
        </div>
      )}
    </OnboardingLayout>
  );
}
