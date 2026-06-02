import { ProgramPageClient } from "@/components/program/ProgramPageClient";
import { redirectIfPremiumLocked } from "@/lib/premium/redirectIfLocked";

export default async function ProgramPage() {
  await redirectIfPremiumLocked();
  return <ProgramPageClient />;
}
