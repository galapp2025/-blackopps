import { NextResponse } from "next/server";

import { analyzeVoters } from "@/lib/metrics";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { names?: string[] };
    const names = body.names?.filter((name) => name.trim().length > 0) ?? [];

    if (names.length === 0) {
      return NextResponse.json({ error: "No names provided" }, { status: 400 });
    }

    return NextResponse.json({ voters: analyzeVoters(names) });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
