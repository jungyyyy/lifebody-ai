import { calculateBmi } from "@/lib/program/bmi";
import type { FullProgram } from "@/types/program";

export function FastingTab({
  program,
  heightCm,
  currentWeightKg,
}: {
  program: FullProgram;
  heightCm: number;
  currentWeightKg: number;
}) {
  const bmi = calculateBmi(currentWeightKg, heightCm);
  const isIf = program.fasting_is_intermittent ?? bmi > 25;

  const rules = [
    {
      label: "Daily calories",
      value: `${program.calorie_target} kcal (min 1450)`,
    },
    {
      label: "Daily protein",
      value: `${program.protein_target_g}g`,
    },
    {
      label: "Weekly fat loss target",
      value: `${program.weekly_fat_loss_kg} kg/week`,
    },
    { label: "Program length", value: `${program.program_length_weeks} weeks` },
    { label: "Phase", value: program.phase_label },
    { label: "Your BMI", value: bmi.toFixed(1) },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
        <h3 className="text-sm font-medium text-accent uppercase tracking-wide">
          {isIf ? "Intermittent fasting (16:8)" : "Overnight fast (12–13 hours)"}
        </h3>
        <p className="mt-2 text-sm text-white leading-relaxed">
          {program.fasting_window}
        </p>
        <p className="mt-3 text-xs text-gray-500">
          {isIf
            ? "Recommended because your BMI is above 25 — eat within an 8-hour window daily."
            : "A light overnight fast supports recovery without aggressive restriction."}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Program rules</h3>
        <ul className="space-y-2">
          {rules.map((r) => (
            <li
              key={r.label}
              className="flex justify-between gap-4 rounded-lg border border-white/10 bg-background px-4 py-3 text-sm"
            >
              <span className="text-gray-400">{r.label}</span>
              <span className="text-white font-medium text-right">{r.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Meal structure</h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {program.meal_structure.overview}
        </p>
        <p className="mt-3 text-sm text-gray-300 whitespace-pre-wrap">
          {program.meal_structure.daily_template}
        </p>
      </div>

      {program.maintenance_note && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100">
          {program.maintenance_note}
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Remember</h3>
        <ul className="space-y-3">
          {program.mindset_notes.map((note, i) => (
            <li
              key={i}
              className="text-sm text-gray-300 leading-relaxed pl-4 border-l-2 border-accent/40"
            >
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
