import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <span aria-hidden>🌿</span>
            <span>LifeBody AI</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-400">
          Welcome back{user.email ? `, ${user.email}` : ""}. Your coaching hub
          will live here.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Food journal", desc: "Log meals conversationally" },
            { title: "Meal prep", desc: "Weekly AI-generated plans" },
            { title: "Workouts", desc: "Programs tailored to your goals" },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-white/10 bg-card p-6"
            >
              <h2 className="font-medium text-white">{card.title}</h2>
              <p className="mt-1 text-sm text-gray-400">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
