import { createClient } from "@/lib/supabase/server";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default async function DashboardPage() {
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
    <DashboardHome
      initialNickname={profile?.nickname?.trim() || "there"}
    />
  );
}
