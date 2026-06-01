import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <div className="mt-6 rounded-xl border border-white/10 bg-card p-6 space-y-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Nickname</p>
          <p className="text-white mt-1">{profile?.nickname || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
          <p className="text-white mt-1">{user?.email}</p>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
