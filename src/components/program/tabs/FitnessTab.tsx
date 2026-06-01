import type { FullProgram } from "@/types/program";

const CATEGORY_ORDER = ["upper", "lower", "other"] as const;

export function FitnessTab({ program }: { program: FullProgram }) {
  const sorted = [...program.workout_days].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400 leading-relaxed">
        {program.exercise_plan.overview}
      </p>
      <p className="text-sm text-gray-300 whitespace-pre-wrap">
        {program.exercise_plan.weekly_schedule}
      </p>

      {sorted.map((day) => (
        <div key={day.title}>
          <h3 className="text-lg font-medium text-white mb-3">{day.title}</h3>
          <div className="space-y-3">
            {day.exercises.map((ex) => (
              <div
                key={ex.name}
                className="rounded-xl border border-white/10 bg-background p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-white">{ex.name}</p>
                  <p className="text-sm text-accent tabular-nums">
                    {ex.sets} × {ex.reps}
                  </p>
                </div>
                <p className="mt-2 text-sm text-gray-400">{ex.tip}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
