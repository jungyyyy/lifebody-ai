import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import {
  defaultSummary,
  getDashboardSummary,
} from "@/lib/dashboard/queries";
import { localDateString } from "@/lib/dates";

export async function GET(request: Request) {
  const { user, supabase, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || localDateString();

  try {
    const summary = await getDashboardSummary(supabase, user!.id, date);
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(defaultSummary(date));
  }
}
