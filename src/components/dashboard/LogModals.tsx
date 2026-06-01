"use client";

import { useState } from "react";
import { Modal } from "@/components/app/Modal";
import { localDateString } from "@/lib/dates";

function SubmitButton({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-accent py-2.5 font-medium text-black hover:bg-accent-hover disabled:opacity-50"
    >
      {children}
    </button>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-background px-4 py-2.5 text-white";

export function WeightModal({
  open,
  onClose,
  onSuccess,
  date,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string, warning?: string) => void;
  date: string;
}) {
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/logs/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg: weight, date }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      onSuccess(json.error ?? "Failed to log weight");
      return;
    }
    onSuccess(json.trendMessage, json.warningMessage);
    setWeight("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Log weight">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputClass}
            placeholder="e.g. 75.5"
            required
          />
        </div>
        <SubmitButton loading={loading}>Save</SubmitButton>
      </form>
    </Modal>
  );
}

export function SportModal({
  open,
  onClose,
  onSuccess,
  date,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  date: string;
}) {
  const [activity, setActivity] = useState("");
  const [minutes, setMinutes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/logs/sport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity,
        durationMinutes: minutes,
        date,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setActivity("");
      setMinutes("");
      onSuccess();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log sport">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">What did you do?</label>
          <input
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className={inputClass}
            placeholder="e.g. Running, yoga"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Duration (minutes)</label>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className={inputClass}
            placeholder="30"
            required
            min={1}
          />
        </div>
        <SubmitButton loading={loading}>Save</SubmitButton>
      </form>
    </Modal>
  );
}

const FASTING_PRESETS = [12, 13, 14, 16, 18];

export function FastingModal({
  open,
  onClose,
  onSuccess,
  date,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  date: string;
}) {
  const [hours, setHours] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(h: number) {
    setLoading(true);
    const res = await fetch("/api/logs/fasting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: h, date }),
    });
    setLoading(false);
    if (res.ok) {
      onSuccess();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log fasting">
      <div className="space-y-4">
        <p className="text-sm text-gray-400">How many hours did you fast today?</p>
        <div className="grid grid-cols-3 gap-2">
          {FASTING_PRESETS.map((h) => (
            <button
              key={h}
              type="button"
              disabled={loading}
              onClick={() => save(h)}
              className="rounded-lg border border-white/10 py-2 text-sm text-white hover:border-accent hover:bg-accent/10"
            >
              {h}h
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(parseFloat(hours));
          }}
          className="flex gap-2"
        >
          <input
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={inputClass}
            placeholder="Other hours"
          />
          <button
            type="submit"
            disabled={loading || !hours}
            className="shrink-0 rounded-lg bg-accent px-4 text-sm font-medium text-black"
          >
            Save
          </button>
        </form>
      </div>
    </Modal>
  );
}

export function useTodayDate() {
  return localDateString();
}
