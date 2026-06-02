import { JournalChat } from "@/components/journal/JournalChat";
import { redirectIfPremiumLocked } from "@/lib/premium/redirectIfLocked";

export default async function JournalPage() {
  await redirectIfPremiumLocked();
  return <JournalChat />;
}
