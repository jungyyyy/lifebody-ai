import { LoadingDots, PrimaryButton } from "../ui";

export function Step6ProgramGen({
  phase,
  error,
  onShowProgram,
}: {
  phase: "loading" | "done" | "error";
  error: string | null;
  onShowProgram: () => void;
}) {
  if (phase === "loading") {
    return (
      <div className="py-16 text-center">
        <LoadingDots />
        <p className="mt-6 text-lg font-medium text-white">
          Hold on, I&apos;m building your 12-week program...
        </p>
        <p className="mt-3 text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
          I&apos;m analyzing your lifestyle, preferences, and goals to create
          something made just for you.
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="py-12 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="py-10 text-center space-y-6">
      <div className="text-4xl" aria-hidden>
        ✨
      </div>
      <p className="text-lg font-medium text-white leading-relaxed">
        Done! I built your 12-week program.
        <br />
        Are you ready to transform your lifestyle in 12 weeks?
      </p>
      <PrimaryButton onClick={onShowProgram}>
        Show me my program →
      </PrimaryButton>
    </div>
  );
}
