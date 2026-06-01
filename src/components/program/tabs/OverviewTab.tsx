import type { FullProgram } from "@/types/program";

export function OverviewTab({
  program,
  currentWeightKg,
}: {
  program: FullProgram;
  currentWeightKg: number;
}) {
  const milestones = program.week_milestones.slice(0, 12);
  const showMaintenance =
    program.maintenance_break?.show || program.maintenance_note;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">{program.block_summary}</p>

      <div className="relative">
        {milestones.map((m, i) => {
          const isCurrent =
            Math.abs(m.expected_weight_kg - currentWeightKg) < 2 && m.week <= 4;
          return (
            <div key={m.week} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`h-3 w-3 rounded-full shrink-0 ${
                    isCurrent ? "bg-accent ring-4 ring-accent/20" : "bg-white/20"
                  }`}
                />
                {i < milestones.length - 1 && (
                  <div className="w-px flex-1 bg-white/10 mt-1 min-h-[2rem]" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-white">Week {m.week}</p>
                  <p className="text-sm text-accent tabular-nums">
                    ~{m.expected_weight_kg} kg
                  </p>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{m.focus}</p>
              </div>
            </div>
          );
        })}

        {showMaintenance && (
          <div className="flex gap-4 mt-2 pt-4 border-t border-dashed border-white/10">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-amber-500/80 shrink-0" />
            </div>
            <div>
              <p className="font-medium text-amber-200">Maintenance break</p>
              <p className="text-sm text-gray-400 mt-1">
                After week 12, take a{" "}
                {program.maintenance_break?.duration_label ?? "4–8 week"}{" "}
                maintenance phase before your next fat-loss block.
                {program.maintenance_note && (
                  <span className="block mt-2">{program.maintenance_note}</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-background p-4">
        <h3 className="text-sm font-medium text-white mb-2">Week highlights</h3>
        <ul className="space-y-2">
          {program.week_highlights.map((h, i) => (
            <li key={i} className="text-sm text-gray-400 flex gap-2">
              <span className="text-accent">→</span>
              {h}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
