import { AppShell } from "@/components/AppShell";
import { VoterDeepDive } from "@/components/voters/VoterDeepDive";

export default function VotersPage() {
  return (
    <AppShell
      active="voters"
      title="בוחרים — מודיעין פרטני"
      subtitle="חיפוש, GOTV, תיק מודיעין עמוק לכל בוחר"
    >
      <VoterDeepDive />
    </AppShell>
  );
}
