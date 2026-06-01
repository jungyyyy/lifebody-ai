import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedProgram } from "@/types/program";

export async function getProgramLengthWeeks(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("program_length_weeks")
    .eq("id", userId)
    .single();

  if (profile?.program_length_weeks) {
    return profile.program_length_weeks;
  }

  const { data: prog } = await supabase
    .from("user_programs")
    .select("program")
    .eq("user_id", userId)
    .eq("block_number", 1)
    .maybeSingle();

  const program = prog?.program as GeneratedProgram | undefined;
  return program?.program_length_weeks ?? 12;
}
