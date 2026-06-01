"use client";

import { Fragment, useState } from "react";
import { MealDetailModal } from "@/components/program/MealDetailModal";
import type { FullProgram, MealSlot, ProgramMeal, WeekdayKey } from "@/types/program";
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  WEEKDAY_LABELS,
  WEEKDAYS,
} from "@/types/program";

export function MealPlanTab({
  program,
  onProgramUpdate,
}: {
  program: FullProgram;
  onProgramUpdate: (p: FullProgram) => void;
}) {
  const [selected, setSelected] = useState<{
    day: WeekdayKey;
    slot: MealSlot;
    meal: ProgramMeal;
  } | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustText, setAdjustText] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustMsg, setAdjustMsg] = useState<string | null>(null);

  async function submitAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustText.trim()) return;
    setAdjustLoading(true);
    setAdjustMsg(null);
    const res = await fetch("/api/program/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: adjustText }),
    });
    const json = await res.json();
    setAdjustLoading(false);
    if (!res.ok) {
      setAdjustMsg(json.error ?? "Update failed");
      return;
    }
    onProgramUpdate(json.program);
    setAdjustMsg(json.message);
    setAdjustText("");
    setAdjustOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto -mx-1 px-1 pb-2">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-8 gap-1.5 text-xs">
            <div />
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center font-medium text-gray-400 py-1"
              >
                {WEEKDAY_LABELS[d]}
              </div>
            ))}
            {MEAL_SLOTS.map((slot) => (
              <Fragment key={slot}>
                <div className="text-gray-500 py-2 pr-2 text-right self-center">
                  {MEAL_SLOT_LABELS[slot]}
                </div>
                {WEEKDAYS.map((day) => {
                  const meal = program.weekly_meal_plan[day][slot];
                  return (
                    <button
                      key={`${day}-${slot}`}
                      type="button"
                      onClick={() =>
                        setSelected({ day, slot, meal })
                      }
                      className="rounded-lg border border-white/10 bg-background p-2 text-left hover:border-accent/40 transition-colors"
                    >
                      <p className="text-[11px] font-medium text-white line-clamp-2 leading-tight">
                        {meal.name}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1 tabular-nums">
                        {Math.round(meal.calories)} kcal · {meal.protein}g
                      </p>
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Grocery list</h3>
        <ul className="grid sm:grid-cols-2 gap-2">
          {program.grocery_list.map((item) => (
            <li
              key={item}
              className="text-sm text-gray-400 flex gap-2 rounded-lg bg-background border border-white/5 px-3 py-2"
            >
              <span className="text-accent shrink-0">□</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-white/10 pt-6">
        {!adjustOpen ? (
          <button
            type="button"
            onClick={() => setAdjustOpen(true)}
            className="w-full rounded-lg border border-dashed border-white/20 py-3 text-sm text-gray-300 hover:border-accent/40 hover:text-white transition-colors"
          >
            Something changed? Let me know
          </button>
        ) : (
          <form onSubmit={submitAdjust} className="space-y-3">
            <p className="text-sm text-gray-400">
              Tell us what changed — e.g. &ldquo;I&apos;m going out for dinner on
              Thursday&rdquo;
            </p>
            <textarea
              value={adjustText}
              onChange={(e) => setAdjustText(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-background px-4 py-2.5 text-sm text-white resize-none"
              placeholder="I'm going out for dinner on Thursday…"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adjustLoading}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-black disabled:opacity-50"
              >
                {adjustLoading ? "Updating…" : "Update my week"}
              </button>
              <button
                type="button"
                onClick={() => setAdjustOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {adjustMsg && (
          <p className="mt-3 text-sm text-accent">{adjustMsg}</p>
        )}
      </div>

      <MealDetailModal
        meal={selected?.meal ?? null}
        dayLabel={selected ? WEEKDAY_LABELS[selected.day] : ""}
        slotLabel={selected ? MEAL_SLOT_LABELS[selected.slot] : ""}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
