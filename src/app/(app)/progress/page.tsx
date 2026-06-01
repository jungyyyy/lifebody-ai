import { ProgressPageClient } from "@/components/progress/ProgressPageClient";
import { redirectIfPremiumLocked } from "@/lib/premium/redirectIfLocked";

export default async function ProgressPage() {
  await redirectIfPremiumLocked();
  return <ProgressPageClient />;
}
