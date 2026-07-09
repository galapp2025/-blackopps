"use client";

import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ActionPanel } from "@/components/dashboard/ActionPanel";
import { FileUploadZone } from "@/components/dashboard/FileUploadZone";
import { MetricsPanel } from "@/components/dashboard/MetricsPanel";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { VoterList } from "@/components/dashboard/VoterList";
import { analyzeLocally, buildLocalVoters, normalizeVoterIds } from "@/lib/analyze";
import { extractNamesFromFile, fallbackNamesPool } from "@/lib/fileParser";
import { type AnalyzedVoter } from "@/lib/metrics";

export default function DashboardPage() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voters, setVoters] = useState<AnalyzedVoter[]>([]);
  const [selectedVoter, setSelectedVoter] = useState<AnalyzedVoter | null>(null);

  const processFile = async (file: File) => {
    setLoading(true);

    try {
      const extractedNames = await extractNamesFromFile(file);
      const finalizedData = analyzeLocally(extractedNames);

      setVoters(finalizedData);
      setSelectedVoter(finalizedData[0]);
      setFileUploaded(true);
    } catch (error) {
      console.error(error);
      const fallbackData = normalizeVoterIds(buildLocalVoters(fallbackNamesPool));
      setVoters(fallbackData);
      setSelectedVoter(fallbackData[0]);
      setFileUploaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      active="dashboard"
      title='חמ"ל בחירות מבצעים מיוחדים'
      subtitle="מנוע מודיעין פסיכולוגי ומערך המלצות אופרטיבי לפי 30 נקודות נתונים מלאות"
    >
      {!fileUploaded ? (
        <FileUploadZone loading={loading} onFileSelect={processFile} />
      ) : (
        <div className="animate-fade-up space-y-6">
          <StatsBar voters={voters} selectedVoter={selectedVoter} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr]">
            <VoterList voters={voters} selectedVoter={selectedVoter} onSelect={setSelectedVoter} />

            {selectedVoter ? (
              <div className="grid gap-6 lg:grid-cols-3">
                <MetricsPanel voter={selectedVoter} />
                <ActionPanel
                  voter={selectedVoter}
                  onDispatch={() => alert("מערך ההפצה נמצא בשלב פיתוח (Pipeline).")}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AppShell>
  );
}
