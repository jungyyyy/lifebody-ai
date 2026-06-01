import { FourWeekDetailClient } from "@/components/four-week/FourWeekDetailClient";
import { redirectIfPremiumLocked } from "@/lib/premium/redirectIfLocked";

export default async function FourWeekAnalysisPage({
  params,
}: {
  params: { id: string };
}) {
  await redirectIfPremiumLocked();
  return <FourWeekDetailClient id={params.id} />;
}
