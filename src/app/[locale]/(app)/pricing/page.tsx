import { createClient } from "@/lib/supabase/server";
import { PaywallScreen } from "@/components/premium/PaywallScreen";

export default async function PricingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("program_length_weeks")
    .eq("id", user!.id)
    .single();

  return (
    <PaywallScreen programWeeks={profile?.program_length_weeks ?? undefined} />
  );
}
