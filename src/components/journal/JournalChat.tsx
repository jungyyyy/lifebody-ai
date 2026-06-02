"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { ChatMessage, JournalFoodLogResponse } from "@/types/journal";
import { localDateString } from "@/lib/dates";

function FoodBreakdown({
  log,
  t,
  tCommon,
}: {
  log: JournalFoodLogResponse;
  t: ReturnType<typeof useTranslations<"journal">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-white/10 text-xs">
      <table className="w-full">
        <thead>
          <tr className="bg-white/5 text-gray-400">
            <th className="px-2 py-1.5 text-left font-medium">{t("food")}</th>
            <th className="px-2 py-1.5 text-right font-medium">
              {tCommon("kcal")}
            </th>
            <th className="px-2 py-1.5 text-right font-medium">
              {t("proteinCol")}
            </th>
          </tr>
        </thead>
        <tbody>
          {log.items.map((item, i) => (
            <tr key={i} className="border-t border-white/5 text-gray-300">
              <td className="px-2 py-1.5">
                {item.food}{" "}
                <span className="text-gray-500">({item.amount})</span>
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {Math.round(item.calories)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {item.protein}g
              </td>
            </tr>
          ))}
          <tr className="border-t border-white/10 font-medium text-white">
            <td className="px-2 py-1.5">{t("total")}</td>
            <td className="px-2 py-1.5 text-right">
              {Math.round(log.total_calories)}
            </td>
            <td className="px-2 py-1.5 text-right">{log.total_protein}g</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function JournalChat() {
  const t = useTranslations("journal");
  const tCommon = useTranslations("common");
  const [date] = useState(() => localDateString());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({ calories: 0, protein: 0 });
  const [targets, setTargets] = useState({ calories: 1700, protein: 120 });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/dashboard/summary?date=${date}`)
      .then((r) => r.json())
      .then((s) => {
        setTotals({ calories: s.todayCalories, protein: s.todayProtein });
        setTargets({ calories: s.calorieTarget, protein: s.proteinTarget });
      });
  }, [date]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/journal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text, date }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? t("failed"));

      setTotals(json.todayTotals);
      setTargets({
        calories: json.calorieTarget,
        protein: json.proteinTarget,
      });

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: json.response.message,
        log:
          json.response.action === "log_food" ? json.response : undefined,
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            err instanceof Error ? err.message : tCommon("somethingWrong"),
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] max-w-2xl mx-auto">
      <div className="shrink-0 border-b border-white/10 bg-card px-4 py-3">
        <h1 className="text-lg font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {t("todaySummary", {
            calories: totals.calories,
            calorieTarget: targets.calories,
            protein: totals.protein,
            proteinTarget: targets.protein,
          })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">
            {t("emptyHint")}
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-black rounded-br-md"
                  : "bg-card border border-white/10 text-gray-200 rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.log && (
                <FoodBreakdown log={msg.log} t={t} tCommon={tCommon} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <p className="text-sm text-gray-500 animate-pulse">{t("thinking")}</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="shrink-0 border-t border-white/10 bg-card p-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          className="flex-1 rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white placeholder:text-gray-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-black disabled:opacity-50"
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}
