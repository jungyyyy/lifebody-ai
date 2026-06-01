import { AssessmentDetailClient } from "@/components/assessment/AssessmentDetailClient";
import { redirectIfPremiumLocked } from "@/lib/premium/redirectIfLocked";

export default async function AssessmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await redirectIfPremiumLocked();
  return <AssessmentDetailClient id={params.id} />;
}
