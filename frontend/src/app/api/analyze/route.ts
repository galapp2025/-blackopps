import { NextResponse } from "next/server";
import OpenAI from "openai";

import { analyzeVoters, metricsList, type AnalyzedVoter } from "@/lib/metrics";

const MAX_AI_BATCH = 12;

function buildPrompt(names: string[]): string {
  return `You are the core intelligence engine of BlackOpps.
Analyze the following list of voters from an election campaign context: ${JSON.stringify(names)}.
For each person, generate a profile based on exactly 30 strategic data points.

In addition, implement the newly authorized operational features:
1. Omnichannel Execution: Generate the exact, tailor-made WhatsApp text message to mobilize this individual based on their profile.
2. Micro-Targeting Flash Alerts: Detect any critical vulnerability, shift in opinion, or sudden opportunity for influence.

Return strict JSON with this shape:
{
  "voters": [
    {
      "id": "V-1",
      "name": "string",
      "metrics": { "metric name in Hebrew": number between 40 and 100 },
      "recommendations": {
        "channel": "string in Hebrew",
        "trigger": "string in Hebrew",
        "avoid": "string in Hebrew"
      },
      "operational": {
        "flashAlert": "string in Hebrew",
        "actionableMessage": "string in Hebrew"
      }
    }
  ]
}

The metrics object must use exactly these 30 Hebrew keys:
${metricsList.map((metric) => `"${metric}"`).join(", ")}`;
}

function normalizeAiVoters(raw: unknown, names: string[]): AnalyzedVoter[] {
  const fallback = analyzeVoters(names);
  if (!raw || typeof raw !== "object") return fallback;

  const voters = (raw as { voters?: unknown }).voters;
  if (!Array.isArray(voters)) return fallback;

  return voters.map((item, index) => {
    const base = fallback[index] ?? fallback[0];
    if (!item || typeof item !== "object") return { ...base, id: `V-${index + 1}` };

    const record = item as Partial<AnalyzedVoter>;
    return {
      id: `V-${index + 1}`,
      name: typeof record.name === "string" ? record.name : names[index] ?? base.name,
      metrics: record.metrics && typeof record.metrics === "object" ? record.metrics : base.metrics,
      recommendations:
        record.recommendations && typeof record.recommendations === "object"
          ? { ...base.recommendations, ...record.recommendations }
          : base.recommendations,
      operational:
        record.operational && typeof record.operational === "object"
          ? record.operational
          : base.operational,
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { names?: string[] };
    const names = body.names?.filter((name) => name.trim().length > 0).slice(0, MAX_AI_BATCH) ?? [];

    if (names.length === 0) {
      return NextResponse.json({ error: "No names provided" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ voters: analyzeVoters(names) });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: buildPrompt(names) }],
      response_format: { type: "json_object" },
    });

    const responseText = response.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(responseText) as unknown;
    const voters = normalizeAiVoters(data, names);

    return NextResponse.json({ voters });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
