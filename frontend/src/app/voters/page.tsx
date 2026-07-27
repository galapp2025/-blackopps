import { AppShell } from "@/components/AppShell";
import VoterDashboard from "@/components/VoterDashboard";

export default function VotersPage() {
  return (
    <AppShell
      active="voters"
      title="מאגר בוחרים והעשרה"
      subtitle="PostgreSQL + 24 סוכני Celery — יצירה, צפייה והפעלת העשרה"
    >
      <VoterDashboard />
    </AppShell>
  );
}
