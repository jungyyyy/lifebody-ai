export function ProgressBar({
  value,
  max,
  label,
  unit,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-2xl font-semibold text-white tabular-nums">
          {value}
          <span className="text-sm font-normal text-gray-500">
            {" "}
            / {max}
            {unit}
          </span>
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
